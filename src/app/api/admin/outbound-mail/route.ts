import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeamAdmin } from "@/app/api/accounts/utils";
import { getDictionary, translate } from "@/lib/i18n";
import { getServerLang } from "@/lib/i18n/server";
import { getNodeMailer, getOutboundSettings, updateOutboundSettings } from "@/lib/outbound-mail/service";

const settingsSchema = z.object({ provider: z.enum(["direct", "relay"]), fallback: z.boolean() }).strict();

export async function GET(request: Request) {
	const access = await requireTeamAdmin(request);
	if (access.error) return access.error;
	const settings = await getOutboundSettings(access.env);
	const mailer = getNodeMailer(access.env);
	return NextResponse.json({
		...settings,
		available: mailer?.getAvailability() ?? { direct: false, relay: false },
		...(mailer?.getHosts() ?? { directHost: null, relayHost: null }),
	}, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
	const access = await requireTeamAdmin(request);
	if (access.error) return access.error;
	const lang = await getServerLang(request);
	const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return NextResponse.json({ error: translate(getDictionary(lang), "server.invalidOutboundMailSettings") }, { status: 400 });
	return NextResponse.json(await updateOutboundSettings(access.env, parsed.data));
}
