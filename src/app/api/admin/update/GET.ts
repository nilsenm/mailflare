import { NextResponse } from "next/server";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";
import { authorizeAdminRequest, getUpdateStatus } from "./utils";

export async function GET(request: Request) {
	const authorization = await authorizeAdminRequest(request);
	if ("error" in authorization) return authorization.error;

	try {
		return NextResponse.json(await getUpdateStatus(authorization.env));
	} catch (error) {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		const message = error instanceof Error ? error.message : translate(dict, "server.couldNotCheckUpdates");
		const status = message.includes("must be configured") ? 503 : 502;
		return NextResponse.json({ error: message }, { status });
	}
}