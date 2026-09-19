import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { activateLicense } from "@/lib/licenses/service";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";
import {
	getLicenseErrorResponse,
	getLicenseInstanceUrl,
	parseLicenseKeyRequest,
	requireLicenseAdmin,
} from "../utils";

export async function POST(request: Request) {
	const env = getEnv();
	const forbidden = await requireLicenseAdmin(env, request);
	if (forbidden) return forbidden;

	try {
		const { licenseKey, plan } = await parseLicenseKeyRequest(request);
		if (!plan) {
			const lang = await getServerLang(request);
			const dict = getDictionary(lang);
			return NextResponse.json({ error: translate(dict, "server.chooseProOrTeam") }, { status: 400 });
		}
		const license = await activateLicense(env, licenseKey, getLicenseInstanceUrl(request), plan);
		return NextResponse.json({ license });
	} catch (error) {
		return await getLicenseErrorResponse(error, request);
	}
}
