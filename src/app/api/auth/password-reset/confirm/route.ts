import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { passwordResetConfirmSchema } from "@/lib/validators";
import { allowLoginAttempt } from "@/lib/auth/rate-limit";
import { readJsonBody } from "@/lib/http/request";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { completePasswordReset } from "@/lib/auth/password-reset";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function POST(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	let body: unknown;
	try {
		body = await readJsonBody(request, 16 * 1024);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: translate(dict, "server.invalidRequest") }, { status });
	}
	const parsed = passwordResetConfirmSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: translate(dict, "server.passwordMinLength") }, { status: 400 });
	}
	if (!(await allowLoginAttempt(env, request))) {
		return NextResponse.json({ error: translate(dict, "server.tooManyAttempts") }, { status: 429, headers: { "Retry-After": "60" } });
	}

	const result = await completePasswordReset(env, parsed.data.token, parsed.data.password, request);
	if (!result.ok) {
		const errorMsg = result.error === "This reset link is invalid or has expired. Request a new one."
			? translate(dict, "server.resetLinkExpired")
			: result.error;
		return NextResponse.json({ error: errorMsg }, { status: 400 });
	}
	return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
