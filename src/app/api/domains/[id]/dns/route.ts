import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireUser } from "@/lib/auth/cookies";
import { getDomainDns, getDomainForUser } from "@/lib/domains/service";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	const domain = await getDomainForUser(env, user.id, id);
	if (!domain) {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		return NextResponse.json({ error: translate(dict, "server.notFound") }, { status: 404 });
	}

	try {
		const dns = await getDomainDns(env, domain);
		return NextResponse.json({
			domain: { ...domain, sendingEnabled: dns.sendingEnabled },
			dns,
		});
	} catch (err) {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		const message = err instanceof Error ? err.message : translate(dict, "server.failedFetchDns");
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
