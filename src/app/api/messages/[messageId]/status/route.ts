import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { getCurrentUser } from "@/lib/auth/cookies";
import { updateMessageStatusForUser } from "@/lib/user";
import type { MessageStatusPayload } from "./types";
import { isAllowedMessageStatus } from "./utils";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ messageId: string }> },
) {
	const { messageId } = await params;
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const user = await getCurrentUser(env, request);
	if (!user) {
		return NextResponse.json({ error: translate(dict, "server.unauthorized") }, { status: 401 });
	}

	const payload = (await request.json()) as MessageStatusPayload;
	if (!isAllowedMessageStatus(payload.status)) {
		return NextResponse.json({ error: translate(dict, "server.invalidMessageStatus") }, { status: 400 });
	}

	const success = await updateMessageStatusForUser(env, user, messageId, payload.status);
	if (!success) {
		return NextResponse.json({ error: translate(dict, "server.messageNotFound") }, { status: 404 });
	}

	return NextResponse.json({ success: true });
}
