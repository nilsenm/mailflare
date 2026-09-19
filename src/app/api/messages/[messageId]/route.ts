import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { getMessageWithBodyForUser } from "@/lib/email/inbound";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

type MessageRouteParams = {
	params: Promise<{ messageId: string }>;
};

export async function GET(request: Request, { params }: MessageRouteParams) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const user = await getCurrentUser(env, request);
	if (!user) {
		return NextResponse.json({ error: translate(dict, "server.unauthorized") }, { status: 401 });
	}

	const { messageId } = await params;
	const data = await getMessageWithBodyForUser(env, user, messageId);
	if (!data) {
		return NextResponse.json({ error: translate(dict, "server.notFound") }, { status: 404 });
	}

	return NextResponse.json(data);
}
