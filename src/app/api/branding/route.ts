import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/cookies";
import { getBranding, updateBranding } from "@/lib/branding/service";
import { getEnv } from "@/lib/cloudflare";
import { BRANDING_ICON_TYPES, isBrandingIcon, MAX_BRANDING_ICON_SIZE } from "./utils";

export async function GET() {
	return NextResponse.json(await getBranding(getEnv()), {
		headers: { "Cache-Control": "no-store" },
	});
}

export async function PUT(request: Request) {
	const env = getEnv();
	try {
		assertAdmin(await requireUser(env, request));
	} catch {
		return NextResponse.json({ error: "Prohibido" }, { status: 403 });
	}

	const form = await request.formData();
	const appName = String(form.get("appName") ?? "").trim();
	const iconValue = form.get("icon");
	if (!appName || appName.length > 60) {
		return NextResponse.json({ error: "El nombre de la aplicación debe tener entre 1 y 60 caracteres" }, { status: 400 });
	}
	const icon = isBrandingIcon(iconValue) && iconValue.size > 0 ? iconValue : null;
	if (icon && !BRANDING_ICON_TYPES.includes(icon.type)) {
		return NextResponse.json({ error: "Usa una imagen PNG, JPEG, WebP o GIF" }, { status: 400 });
	}
	if (icon && icon.size > MAX_BRANDING_ICON_SIZE) {
		return NextResponse.json({ error: "El ícono debe pesar 2 MB o menos" }, { status: 413 });
	}

	try {
		return NextResponse.json(await updateBranding(env, { appName, icon }));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to update branding";
		const status = /license is required/i.test(message) ? 403 : 500;
		return NextResponse.json({ error: message }, { status });
	}
}
