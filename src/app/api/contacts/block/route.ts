import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { blockContact } from "@/lib/contacts/service";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";
import type { BlockContactRequest } from "./types";

export async function POST(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const user = await requireUser(env, request);
	const body = (await request.json()) as BlockContactRequest;
	if (!body.mailboxId || !body.address?.trim()) {
		return NextResponse.json({ error: translate(dict, "server.mailboxAndContactRequired") }, { status: 400 });
	}

	const access = await getMailboxAccessLevel(getDb(env), user, body.mailboxId);
	if (!access?.canManage) {
		return NextResponse.json({ error: translate(dict, "server.mailboxNotFound") }, { status: 404 });
	}

	const contact = await blockContact(env, {
		userId: access.mailbox.userId,
		mailboxId: access.mailbox.id,
		domainId: access.mailbox.domainId,
		address: body.address,
	});
	return NextResponse.json({ contact });
}
