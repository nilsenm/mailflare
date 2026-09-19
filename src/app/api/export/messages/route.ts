import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { exportMailboxToMbox } from "@/lib/export/mbox";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function GET(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const user = await requireUser(env, request);
	const url = new URL(request.url);
	const mailboxId = url.searchParams.get("mailboxId");
	if (!mailboxId) return NextResponse.json({ error: translate(dict, "server.mailboxRequired") }, { status: 400 });

	const access = await getMailboxAccessLevel(getDb(env), user, mailboxId);
	if (!access?.canRead) {
		return NextResponse.json({ error: translate(dict, "server.mailboxNotFound") }, { status: 404 });
	}

	const mbox = await exportMailboxToMbox(env, mailboxId);
	const address = `${access.mailbox.localPart}.mbox`;
	return new Response(mbox, {
		headers: {
			"Content-Type": "application/mbox; charset=utf-8",
			"Content-Disposition": `attachment; filename="${address}"`,
			"Cache-Control": "no-store",
		},
	});
}
