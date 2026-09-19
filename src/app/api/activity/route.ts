import { desc, inArray, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { assertAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function GET(request: Request) {
	const env = getEnv();
	const admin = await requireUser(env, request);
	try {
		assertAdmin(admin);
	} catch {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		return NextResponse.json({ error: translate(dict, "server.forbidden") }, { status: 403 });
	}

	const url = new URL(request.url);
	const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 200);
	const rows = await getDb(env)
		.select({
			id: auditLogs.id,
			action: auditLogs.action,
			metadata: auditLogs.metadata,
			createdAt: auditLogs.createdAt,
			actorEmail: users.email,
		})
		.from(auditLogs)
		.leftJoin(users, eq(users.id, auditLogs.actorUserId))
		.where(inArray(auditLogs.action, ["auth.login", "auth.logout"]))
		.orderBy(desc(auditLogs.createdAt))
		.limit(limit);

	return NextResponse.json({ activities: rows });
}
