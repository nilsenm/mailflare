import { NextResponse } from "next/server";
import { hasAdminAccount } from "@/lib/auth/setup";
import { getEnv } from "@/lib/cloudflare";
import { preflightDomain } from "@/lib/domains/preflight";
import { hasConflictingMxRecords } from "@/lib/domains/mx-records";
import { setupDomainSchema } from "@/lib/validators";
import { readJsonBody } from "@/lib/http/request";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function POST(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	if (await hasAdminAccount(env)) {
		return NextResponse.json({ error: translate(dict, "server.initialSetupComplete") }, { status: 403 });
	}

	let body: unknown;
	try {
		body = await readJsonBody(request, 16 * 1024);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: translate(dict, "server.invalidMxCheckRequest") }, { status });
	}

	const parsed = setupDomainSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}

	try {
		const domain = await preflightDomain(env, parsed.data.hostname);
		const hasExistingMx = await hasConflictingMxRecords(
			env,
			domain.zone.id,
			domain.hostname,
		);
		return NextResponse.json({ hasExistingMx });
	} catch (error) {
		const message = error instanceof Error ? error.message : translate(dict, "server.mxCheckFailed");
		return NextResponse.json({ error: message }, { status: 502 });
	}
}
