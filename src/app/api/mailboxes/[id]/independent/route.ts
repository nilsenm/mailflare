import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { accountListItemFromUser, requireTeamAdmin } from "@/app/api/accounts/utils";
import { hashPassword } from "@/lib/auth/password";
import { newId } from "@/lib/ids";
import { getDictionary, translate, type TranslationKey } from "@/lib/i18n";
import { getServerLang } from "@/lib/i18n/server";
import {
	evaluateIndependentConversion,
	resolveIndependentAccountName,
	type IndependentRejection,
} from "@/lib/mailboxes/independent-utils";
import { makeMailboxIndependentSchema } from "@/lib/validators";
import type { MailboxRouteParams } from "../types";
import { convertMailboxToAccount, selectMailboxForConversion } from "./utils";

const rejectionMessages: Record<IndependentRejection, TranslationKey> = {
	not_found: "server.mailboxNotFound",
	not_personal: "server.mailboxNotPersonal",
	already_primary: "server.mailboxAlreadyIndependent",
};

/** Gives a mailbox its own password: it becomes an independent account and keeps its mail. */
export async function POST(request: Request, { params }: MailboxRouteParams) {
	const access = await requireTeamAdmin(request);
	if (access.error) return access.error;
	const { id } = await params;
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);

	const parsed = makeMailboxIndependentSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}

	const db = getDb(access.env);
	const mailbox = await selectMailboxForConversion(db, id, access.user!.id);
	const decision = evaluateIndependentConversion(mailbox, mailbox?.ownerEmail);
	if (!decision.ok || !mailbox) {
		const reason = decision.ok ? "not_found" : decision.reason;
		return NextResponse.json({ error: translate(dict, rejectionMessages[reason]) }, { status: 400 });
	}

	const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, decision.email)).limit(1);
	if (existing) {
		return NextResponse.json({ error: translate(dict, "server.emailAlreadyRegistered") }, { status: 409 });
	}

	try {
		const account = await convertMailboxToAccount(db, mailbox, {
			id: newId("usr"),
			email: decision.email,
			passwordHash: hashPassword(parsed.data.password),
			name: resolveIndependentAccountName({
				displayName: parsed.data.displayName,
				mailboxDisplayName: mailbox.displayName,
				localPart: mailbox.localPart,
			}),
			avatarKey: mailbox.avatarKey,
			resetEmail: parsed.data.resetEmail ?? null,
			createdByUserId: access.user!.id,
		});
		if (!account) throw new Error(translate(dict, "server.failedMakeMailboxIndependent"));
		return NextResponse.json({ account: accountListItemFromUser(account) });
	} catch (error) {
		console.error("[mailboxes/independent] conversion failed", error);
		return NextResponse.json({ error: translate(dict, "server.failedMakeMailboxIndependent") }, { status: 500 });
	}
}
