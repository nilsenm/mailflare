import { NextResponse } from "next/server";
import { getMigrationStatus } from "@/lib/migrations/service";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";
import { authorizeMigrationRequest } from "./utils";

export async function GET(request: Request) {
	const authorization = await authorizeMigrationRequest(request);
	if ("error" in authorization) return authorization.error;

	try {
		return NextResponse.json(await getMigrationStatus(authorization.env.DB));
	} catch (error) {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : translate(dict, "server.couldNotCheckMigrations") },
			{ status: 500 },
		);
	}
}
