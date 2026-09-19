import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { passwordResetRequestSchema } from "@/lib/validators";
import { allowLoginAttempt } from "@/lib/auth/rate-limit";
import { verifyTurnstileToken } from "@/lib/auth/turnstile";
import { readJsonBody } from "@/lib/http/request";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { requestPasswordReset } from "@/lib/auth/password-reset";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

/**
 * Always answers 200 once the input is well-formed, whether or not the
 * account exists or has a recovery address, so the form reveals nothing.
 */
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
	const parsed = passwordResetRequestSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: translate(dict, "server.enterSignInEmail") }, { status: 400 });
	}
	if (!(await allowLoginAttempt(env, request))) {
		return NextResponse.json({ error: translate(dict, "server.tooManyAttempts") }, { status: 429, headers: { "Retry-After": "60" } });
	}
	if (!(await verifyTurnstileToken(env, request, (body as Record<string, unknown>).turnstileToken))) {
		return NextResponse.json({ error: translate(dict, "server.verificationFailed") }, { status: 400 });
	}

	const origin = env.APP_URL?.trim() || new URL(request.url).origin;
	try {
		await requestPasswordReset(env, parsed.data.email, origin);
	} catch (error) {
		// Delivery problems are logged, never surfaced: the answer stays uniform.
		console.error("Password reset request failed", error);
	}
	return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
