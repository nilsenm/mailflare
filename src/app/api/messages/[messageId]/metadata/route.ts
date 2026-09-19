import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { getMessageMetadataForUser } from "@/lib/email/inbound";
import type { MessageMetadataRouteParams } from "./types";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function GET(request: Request, { params }: MessageMetadataRouteParams) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const user = await getCurrentUser(env, request);
	if (!user) return NextResponse.json({ error: translate(dict, "server.unauthorized") }, { status: 401 });

	const { messageId } = await params;
	const metadata = await getMessageMetadataForUser(env, user, messageId);
	if (!metadata) return NextResponse.json({ error: translate(dict, "server.notFound") }, { status: 404 });
	return NextResponse.json(metadata);
}
