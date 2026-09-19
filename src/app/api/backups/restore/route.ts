import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/cookies";
import { restoreDatabaseRecords } from "@/lib/backups/export";
import { getEnv } from "@/lib/cloudflare";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function POST(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	try {
		const user = await requireUser(env, request);
		assertAdmin(user);
		const form = await request.formData();
		const file = form.get("backup");
		if (!(file instanceof File)) return NextResponse.json({ error: translate(dict, "server.chooseBackupFile") }, { status: 400 });
		await restoreDatabaseRecords(env.DB, await file.arrayBuffer());
		return NextResponse.json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : translate(dict, "server.failedRestoreBackup");
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
