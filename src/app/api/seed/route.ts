import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { seedDemoData } from "@/lib/seed";
import { demoCredentials } from "@/lib/seed-utils";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function POST(request: Request) {
	if (process.env.NODE_ENV === "production") {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		return NextResponse.json({ error: translate(dict, "server.notAvailableInProd") }, { status: 403 });
	}
	const env = getEnv();
	const result = await seedDemoData(env);
	return NextResponse.json({
		ok: true,
		credentials: demoCredentials,
		seeded: result,
	});
}
