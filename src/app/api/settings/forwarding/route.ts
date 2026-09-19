import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { getLicenseEntitlements } from "@/lib/licenses/service";
import type { UpdateForwardingEmailInput } from "./types";
import { parseUpdateForwardingEmailRequest } from "./utils";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function PATCH(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const user = await requireUser(env, request);
	let input: UpdateForwardingEmailInput;
	try {
		input = await parseUpdateForwardingEmailRequest(request);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.flatten() }, { status: 400 });
		}
		return NextResponse.json({ error: translate(dict, "server.invalidRequest") }, { status: 400 });
	}

	if (!(await getLicenseEntitlements(env)).canForwardEmail) {
		return NextResponse.json({ error: translate(dict, "server.licenseRequiredForwarding") }, { status: 403 });
	}

	await getDb(env)
		.update(users)
		.set({ forwardingEmail: input.forwardingEmail })
		.where(eq(users.id, user.id));

	return NextResponse.json({ forwardingEmail: input.forwardingEmail });
}
