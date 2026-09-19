import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/app/api/admin/update/utils";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function authorizeMigrationRequest(request: Request) {
	const authorization = await authorizeAdminRequest(request);
	if ("error" in authorization) return authorization;
	if (request.method !== "GET" && request.headers.get("Origin") !== new URL(request.url).origin) {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		return { error: NextResponse.json({ error: translate(dict, "server.invalidRequestOrigin") }, { status: 403 }) };
	}
	return authorization;
}
