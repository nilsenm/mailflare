import { NextResponse } from "next/server";
import { applyPendingMigrations } from "@/lib/migrations/service";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";
import { authorizeMigrationRequest } from "./utils";

export async function POST(request: Request) {
	const authorization = await authorizeMigrationRequest(request);
	if ("error" in authorization) return authorization.error;

	try {
		return NextResponse.json(await applyPendingMigrations(authorization.env.DB));
	} catch (error) {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : translate(dict, "server.couldNotApplyMigrations") },
			{ status: 500 },
		);
	}
}
