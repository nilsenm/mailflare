import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/cookies";
import { getBranding, updateBranding } from "@/lib/branding/service";
import { getEnv } from "@/lib/cloudflare";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";
import { BRANDING_ICON_TYPES, isBrandingIcon, MAX_BRANDING_ICON_SIZE } from "./utils";

export async function GET() {
	return NextResponse.json(await getBranding(getEnv()), {
		headers: { "Cache-Control": "no-store" },
	});
}

export async function PUT(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);

	try {
		assertAdmin(await requireUser(env, request));
	} catch {
		return NextResponse.json({ error: translate(dict, "server.forbidden") }, { status: 403 });
	}

	const form = await request.formData();
	const appName = String(form.get("appName") ?? "").trim();
	const iconValue = form.get("icon");
	if (!appName || appName.length > 60) {
		return NextResponse.json({ error: translate(dict, "server.appNameLength") }, { status: 400 });
	}
	const icon = isBrandingIcon(iconValue) && iconValue.size > 0 ? iconValue : null;
	if (icon && !BRANDING_ICON_TYPES.includes(icon.type)) {
		return NextResponse.json({ error: translate(dict, "server.usePngJpegWebpGif") }, { status: 400 });
	}
	if (icon && icon.size > MAX_BRANDING_ICON_SIZE) {
		return NextResponse.json({ error: translate(dict, "server.iconTooLarge") }, { status: 413 });
	}

	try {
		return NextResponse.json(await updateBranding(env, { appName, icon }));
	} catch (error) {
		const message = error instanceof Error ? error.message : translate(dict, "server.unableUpdateBranding");
		const status = /license is required/i.test(message) ? 403 : 500;
		return NextResponse.json({ error: message }, { status });
	}
}
