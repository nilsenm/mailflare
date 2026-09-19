import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { mailboxes, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { newId } from "@/lib/ids";
import { createUserAccountSchema } from "@/lib/validators";
import { ensureEmailRoutingRuleToWorker } from "@/lib/cloudflare-api";
import { ensureMailboxDomainRouting } from "@/lib/mailboxes/domain-addresses";
import { resolveNewAccountName } from "@/lib/mailboxes/independent-utils";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";
import type { CreateUserAccountInput } from "./types";
import {
	accountListItemFromUser,
	getDomainForAdmin,
	getExistingMailbox,
	listAccountsForAdmin,
	requireTeamAdmin,
} from "./utils";

export async function GET(request: Request) {
	const access = await requireTeamAdmin(request);
	if (access.error) return access.error;
	const rows = await listAccountsForAdmin(getDb(access.env));
	return NextResponse.json({
		accounts: rows.map((row) => accountListItemFromUser(row)),
	});
}

export async function POST(request: Request) {
	const access = await requireTeamAdmin(request);
	if (access.error) return access.error;

	const parsed = createUserAccountSchema.safeParse(await request.json());
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}

	const input: CreateUserAccountInput = parsed.data;
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const db = getDb(access.env);
	const domain = await getDomainForAdmin(db, access.user!.id, input.domainId);
	if (!domain) return NextResponse.json({ error: translate(dict, "server.domainNotFound") }, { status: 404 });
	const username = input.username.toLowerCase().trim();
	const email = `${username}@${domain.hostname}`;
	const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
	if (existing) return NextResponse.json({ error: translate(dict, "server.emailAlreadyRegistered") }, { status: 409 });
	const mailbox = await getExistingMailbox(db, domain.id, username);
	if (mailbox) return NextResponse.json({ error: translate(dict, "server.emailAlreadyAssigned") }, { status: 409 });

	const displayName = resolveNewAccountName(input.displayName, username);
	const userId = newId("usr");
	try {
		await ensureEmailRoutingRuleToWorker(access.env, domain.zoneId, email);
		const [account] = await db
			.insert(users)
			.values({
				id: userId,
				email,
				passwordHash: hashPassword(input.password),
				name: displayName,
				resetEmail: input.resetEmail ?? null,
				role: input.role,
				createdByUserId: access.user!.id,
			})
			.returning({
				id: users.id,
				email: users.email,
				name: users.name,
				resetEmail: users.resetEmail,
				role: users.role,
				disabled: users.disabled,
				createdAt: users.createdAt,
			});
		const mailboxId = newId("mbx");
		await db.insert(mailboxes).values({
			id: mailboxId,
			userId,
			domainId: domain.id,
			localPart: username,
			displayName,
		});
		await ensureMailboxDomainRouting(access.env, db, { id: mailboxId, domainId: domain.id, localPart: username, useAllDomains: true });

		return NextResponse.json({ account: accountListItemFromUser(account) }, { status: 201 });
	} catch (error) {
		await db.delete(users).where(eq(users.id, userId));
		const message = error instanceof Error ? error.message : translate(dict, "server.failedCreateAccountMailbox");
		return NextResponse.json({ error: message }, { status: 502 });
	}
}
