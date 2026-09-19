import { NextResponse } from "next/server";
import { authorizeAdminRequest, dispatchUpdateWorkflow, getUpdateStatus } from "./utils";
import { isNodeRuntime } from "@/lib/runtime";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function POST(request: Request) {
	const authorization = await authorizeAdminRequest(request);
	if ("error" in authorization) return authorization.error;
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);

	if (isNodeRuntime(authorization.env)) {
		return NextResponse.json({ error: translate(dict, "server.selfHostedUpdateHint") }, { status: 400 });
	}

	try {
    // assume it's already passed
		// const status = await getUpdateStatus(authorization.env);
		// if (!status.available) {
		// 	return NextResponse.json({ error: "Mailflare is already up to date", ...status }, { status: 409 });
		// }

		const dispatch = await dispatchUpdateWorkflow();

		return NextResponse.json({ ok: true, ...dispatch }, { status: 202 });
	} catch (error) {
		const message = error instanceof Error ? error.message : translate(dict, "server.couldNotTriggerUpdate");
		const status = message.includes("must be configured") ? 503 : 502;
		return NextResponse.json({ error: message }, { status });
	}
}