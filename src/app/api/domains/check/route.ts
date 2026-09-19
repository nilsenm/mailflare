import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { preflightDomain } from "@/lib/domains/preflight";
import { setupDomainSchema } from "@/lib/validators";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function POST(request: Request) {
	const env = getEnv();
	await requireUser(env, request);
	const parsed = setupDomainSchema.safeParse(await request.json());
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}

	try {
		return NextResponse.json({ domain: await preflightDomain(env, parsed.data.hostname) });
	} catch (error) {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		const message = error instanceof Error ? error.message : translate(dict, "server.domainCheckFailed");
		return NextResponse.json({ error: message }, { status: 502 });
	}
}
