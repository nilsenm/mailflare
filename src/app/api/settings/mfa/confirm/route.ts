import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSessionUser } from "@/lib/api/auth";
import { readJsonBody } from "@/lib/http/request";
import { getSessionTokenFromRequestHeaders } from "@/lib/auth/session";
import { confirmMfaEnrollment } from "@/lib/auth/mfa";
import { mfaConfirmSchema } from "@/lib/validators";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

/** Proves the authenticator has the secret; turns MFA on and returns recovery codes once. */
export async function POST(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	const parsed = mfaConfirmSchema.safeParse(await readJsonBody(request, 16 * 1024).catch(() => null));
	if (!parsed.success) return NextResponse.json({ error: translate(dict, "server.enterSixDigitCode") }, { status: 400 });
	const result = await confirmMfaEnrollment(env, auth.user, parsed.data.code, getSessionTokenFromRequestHeaders(request));
	if (!result.ok) {
		let error = result.error;
		if (result.error === "Start enrolment first") error = translate(dict, "server.startEnrollmentFirst");
		else if (result.error === "Two-factor authentication is already on") error = translate(dict, "server.mfaAlreadyOn");
		else if (result.error === "That code did not match. Check the time on your device and try again.") error = translate(dict, "server.codeDidNotMatchTime");
		return NextResponse.json({ error }, { status: 400 });
	}
	return NextResponse.json({ ok: true, recoveryCodes: result.recoveryCodes }, { headers: { "Cache-Control": "no-store" } });
}
