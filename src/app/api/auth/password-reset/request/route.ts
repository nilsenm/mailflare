import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { passwordResetRequestSchema } from "@/lib/validators";
import { allowLoginAttempt } from "@/lib/auth/rate-limit";
import { verifyTurnstileToken } from "@/lib/auth/turnstile";
import { readJsonBody } from "@/lib/http/request";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { requestPasswordReset } from "@/lib/auth/password-reset";

/**
 * Always answers 200 once the input is well-formed, whether or not the
 * account exists or has a recovery address, so the form reveals nothing.
 */
export async function POST(request: Request) {
	const env = getEnv();
	let body: unknown;
	try {
		body = await readJsonBody(request, 16 * 1024);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: "Solicitud no válida" }, { status });
	}
	const parsed = passwordResetRequestSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: "Ingresa la dirección de correo con la que inicias sesión" }, { status: 400 });
	}
	if (!(await allowLoginAttempt(env, request))) {
		return NextResponse.json({ error: "Demasiados intentos. Inténtalo de nuevo en unos minutos." }, { status: 429, headers: { "Retry-After": "60" } });
	}
	if (!(await verifyTurnstileToken(env, request, (body as Record<string, unknown>).turnstileToken))) {
		return NextResponse.json({ error: "La verificación falló. Inténtalo de nuevo." }, { status: 400 });
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
