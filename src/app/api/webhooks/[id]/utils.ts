import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { webhooks } from "@/db/schema";
import { requireSessionUser } from "@/lib/api/auth";
import { getEnv } from "@/lib/cloudflare";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

/** Loads a webhook owned by the caller, or the 404 response to return instead. */
export async function loadOwnedWebhook(request: Request, id: string) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return { error: auth.error } as const;
	const user = auth.user;
	const db = getDb(env);
	const [hook] = await db
		.select()
		.from(webhooks)
		.where(and(eq(webhooks.id, id), eq(webhooks.userId, user.id)))
		.limit(1);

	if (!hook) {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		return { error: NextResponse.json({ error: translate(dict, "server.webhookNotFound") }, { status: 404 }) } as const;
	}
	return { env, db, user, hook, error: null } as const;
}
