import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/cookies";
import { deleteBackup } from "@/lib/backups/service";
import { getEnv } from "@/lib/cloudflare";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	try {
		const user = await requireUser(env, request);
		assertAdmin(user);
		const { id } = await params;
		const deleted = await deleteBackup(env, id);
		if (!deleted) return NextResponse.json({ error: translate(dict, "server.backupNotFound") }, { status: 404 });
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: translate(dict, "server.forbidden") }, { status: 403 });
	}
}
