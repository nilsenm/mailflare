import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/admin";
import { requireSessionUser } from "@/lib/api/auth";
import { getEnv } from "@/lib/cloudflare";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";
import { getSearchIndexStatus, rebuildSearchIndex } from "@/lib/search/index-admin";

/** Row counts for the index versus the messages table, to spot drift. */
export async function GET(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	try {
		assertAdmin(auth.user);
	} catch {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		return NextResponse.json({ error: translate(dict, "server.forbidden") }, { status: 403 });
	}
	return NextResponse.json(await getSearchIndexStatus(env));
}

/** Re-index every message from the messages table. Safe to run at any time. */
export async function POST(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	try {
		assertAdmin(auth.user);
	} catch {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		return NextResponse.json({ error: translate(dict, "server.forbidden") }, { status: 403 });
	}
	await rebuildSearchIndex(env);
	return NextResponse.json(await getSearchIndexStatus(env));
}
