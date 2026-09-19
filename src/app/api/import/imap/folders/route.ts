import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { readJsonBody } from "@/lib/http/request";
import { listImapFolders } from "@/lib/import/imap";
import type { ImapFolderListRequest } from "./types";
import { parseImapFolderListRequest } from "./utils";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function POST(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	await requireUser(env, request);
	let input: ReturnType<typeof parseImapFolderListRequest>;
	try {
		const body = await readJsonBody<ImapFolderListRequest>(request, 16 * 1024);
		input = parseImapFolderListRequest(body);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: error instanceof Error ? error.message : translate(dict, "server.invalidImapFolderRequest") }, { status });
	}

	try {
		const folders = await listImapFolders(input);
		return NextResponse.json({ folders });
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : translate(dict, "server.unableListImapFolders") },
			{ status: 502 },
		);
	}
}
