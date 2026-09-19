import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSessionUser } from "@/lib/api/auth";
import { readJsonBody } from "@/lib/http/request";
import { verifyPassword } from "@/lib/auth/password";
import { beginMfaEnrollment } from "@/lib/auth/mfa";
import { mfaEnrollSchema } from "@/lib/validators";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

/** Re-checks the password, then returns a new secret with its QR code. */
export async function POST(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	const parsed = mfaEnrollSchema.safeParse(await readJsonBody(request, 16 * 1024).catch(() => null));
	if (!parsed.success) return NextResponse.json({ error: translate(dict, "server.enterPassword") }, { status: 400 });
	if (!verifyPassword(parsed.data.password, auth.user.passwordHash)) {
		return NextResponse.json({ error: translate(dict, "server.passwordIncorrect") }, { status: 400 });
	}
	if (auth.user.totpEnabled) {
		return NextResponse.json({ error: translate(dict, "server.mfaAlreadyOn") }, { status: 400 });
	}
	return NextResponse.json(await beginMfaEnrollment(env, auth.user), { headers: { "Cache-Control": "no-store" } });
}
