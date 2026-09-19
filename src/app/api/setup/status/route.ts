import { NextResponse } from "next/server";
import { hasAdminAccount } from "@/lib/auth/setup";
import { getEnv } from "@/lib/cloudflare";
import { getPrimaryDomain } from "@/lib/user";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function GET(request: Request) {
	const env = getEnv();
	try {
		const [adminAccountExists, domain] = await Promise.all([
			hasAdminAccount(env),
			getPrimaryDomain(env),
		]);
		return NextResponse.json({
			hasAdminAccount: adminAccountExists,
			hasPrimaryDomain: !!domain,
			primaryDomain: domain
				? { hostname: domain.hostname, sendingRequested: domain.sendingRequested }
				: null,
		}, {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (error) {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		const message = error instanceof Error ? error.message : translate(dict, "server.couldNotLoadSetupStatus");
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
