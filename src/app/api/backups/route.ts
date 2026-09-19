import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/cookies";
import { getBackupConfigurationStatus } from "@/lib/backups/export";
import { runDatabaseBackup } from "@/lib/backups/runner";
import {
	createBackupRecord,
	getBackupSettings,
	listBackups,
	updateBackupSettings,
} from "@/lib/backups/service";
import { getEnv } from "@/lib/cloudflare";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";
import { parseBackupSettingsInput } from "./utils";

async function requireAdmin(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	assertAdmin(user);
	return { env, user };
}

export async function GET(request: Request) {
	try {
		const { env } = await requireAdmin(request);
		const [settings, backupList] = await Promise.all([
			getBackupSettings(env),
			listBackups(env),
		]);
		return NextResponse.json({
			settings,
			backups: backupList,
			configuration: getBackupConfigurationStatus(env),
		});
	} catch {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		return NextResponse.json({ error: translate(dict, "server.forbidden") }, { status: 403 });
	}
}

export async function PUT(request: Request) {
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	try {
		const { env } = await requireAdmin(request);
		const input = parseBackupSettingsInput(await request.json());
		if (!input) return NextResponse.json({ error: translate(dict, "server.invalidBackupSettings") }, { status: 400 });
		await updateBackupSettings(env, input);
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: translate(dict, "server.forbidden") }, { status: 403 });
	}
}

export async function POST(request: Request) {
	try {
		const { env, user } = await requireAdmin(request);
		const backupId = await createBackupRecord(env, "manual", user.id);
		await runDatabaseBackup(env, backupId);
		return NextResponse.json({ backupId });
	} catch (error) {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		const message = error instanceof Error ? error.message : translate(dict, "server.failedRunBackup");
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
