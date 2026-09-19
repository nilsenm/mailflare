import { NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { requireTeamAdmin } from "@/app/api/accounts/utils";
import { getDb } from "@/db";
import { domains, mailboxes, users } from "@/db/schema";
import { formatEmailAddress } from "@/lib/email/address";
import { getDictionary, translate } from "@/lib/i18n";
import { getServerLang } from "@/lib/i18n/server";
import { getNodeMailer, getOutboundSettings } from "@/lib/outbound-mail/service";

const testSchema = z.object({ to: z.email(), provider: z.enum(["direct", "relay"]).optional() }).strict();

export async function POST(request: Request) {
	const access = await requireTeamAdmin(request);
	if (access.error) return access.error;
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const parsed = testSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return NextResponse.json({ ok: false, error: translate(dict, "server.invalidOutboundMailTest") }, { status: 400 });
	const mailer = getNodeMailer(access.env);
	if (!mailer) return NextResponse.json({ ok: false, error: translate(dict, "server.outboundMailNodeOnly") }, { status: 400 });
	const [sender] = await getDb(access.env)
		.select({ localPart: mailboxes.localPart, hostname: domains.hostname, name: mailboxes.displayName })
		.from(mailboxes)
		.innerJoin(domains, eq(mailboxes.domainId, domains.id))
		.innerJoin(users, eq(mailboxes.userId, users.id))
		.where(and(eq(users.role, "admin"), eq(users.disabled, false), eq(mailboxes.disabled, false), eq(domains.sendingEnabled, true)))
		.orderBy(asc(mailboxes.createdAt))
		.limit(1);
	if (!sender) return NextResponse.json({ ok: false, error: translate(dict, "server.outboundMailSenderUnavailable") }, { status: 400 });
	try {
		const settings = await getOutboundSettings(access.env);
		const result = await mailer.sendUsing({
			from: formatEmailAddress(`${sender.localPart}@${sender.hostname}`, sender.name ?? "Mailflare"),
			to: parsed.data.to,
			subject: translate(dict, "server.outboundMailTestSubject"),
			text: translate(dict, "server.outboundMailTestBody"),
		}, parsed.data.provider ?? settings.provider, settings.fallback);
		return NextResponse.json({ ok: true, messageId: result.messageId });
	} catch (error) {
		return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) });
	}
}
