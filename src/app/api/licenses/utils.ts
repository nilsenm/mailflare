import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/cookies";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";
import type { LicenseKeyRequest } from "./types";

const licenseKeySchema = z.object({
	licenseKey: z.string().trim().min(1).max(500),
	plan: z.enum(["pro", "team"]).optional(),
});

export async function requireLicenseAdmin(env: CloudflareEnv, request: Request): Promise<NextResponse | null> {
	try {
		assertAdmin(await requireUser(env, request));
		return null;
	} catch {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		return NextResponse.json({ error: translate(dict, "server.forbidden") }, { status: 403 });
	}
}

export async function parseLicenseKeyRequest(request: Request): Promise<LicenseKeyRequest> {
	return licenseKeySchema.parse(await request.json());
}

export function getLicenseInstanceUrl(request: Request): string {
	return new URL(request.url).origin;
}

export async function getLicenseErrorResponse(error: unknown, request?: Request): Promise<NextResponse> {
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	if (error instanceof z.ZodError) {
		return NextResponse.json({ error: translate(dict, "server.enterValidLicenseKey") }, { status: 400 });
	}
	const message = error instanceof Error ? error.message : translate(dict, "server.licenseRequestFailed");
	const migrationMissing = /no such table|license_settings/i.test(message);
	return NextResponse.json(
		{ error: migrationMissing ? translate(dict, "server.applyLatestDbMigrationBeforeLicense") : message },
		{ status: migrationMissing ? 503 : 400 },
	);
}
