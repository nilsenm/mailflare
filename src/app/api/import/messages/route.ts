import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { folders } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { getImportMessageUserId } from "@/lib/import/destination";
import { importMessagesToMailbox } from "@/lib/import/service";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import { parseImportForm } from "./utils";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function POST(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const user = await requireUser(env, request);
	let input: Awaited<ReturnType<typeof parseImportForm>>;
	try {
		input = await parseImportForm(request);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: translate(dict, "server.invalidImportUpload") }, { status });
	}

	if (!input.mailboxId || input.messages.length === 0) {
		return NextResponse.json({ error: translate(dict, "server.selectMailboxAndFile") }, { status: 400 });
	}

	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, input.mailboxId);
	if (!access?.canManage) {
		return NextResponse.json({ error: translate(dict, "server.mailboxNotFound") }, { status: 404 });
	}
	if (input.destination.type === "folder") {
		const [folder] = await db
			.select({ id: folders.id })
			.from(folders)
			.where(and(eq(folders.id, input.destination.folderId), eq(folders.mailboxId, access.mailbox.id)))
			.limit(1);
		if (!folder) {
			return NextResponse.json({ error: translate(dict, "server.folderNotFound") }, { status: 404 });
		}
	}

	const result = await importMessagesToMailbox(env, {
		userId: getImportMessageUserId(input.destination, user.id, access.mailbox.userId),
		mailboxId: access.mailbox.id,
		destination: input.destination,
		messages: input.messages,
	});
	return NextResponse.json(result);
}
