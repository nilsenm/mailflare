import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { domains, mailboxes } from "@/db/schema";
import { requireTeamAdmin } from "../../utils";
import { selectAccountById } from "../utils";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";
import type { AccountRouteParams } from "../types";

export async function GET(request: Request, { params }: AccountRouteParams) {
	const access = await requireTeamAdmin(request);
	if (access.error) return access.error;
	const { id } = await params;
	const db = getDb(access.env);
	const account = await selectAccountById(db, id);
	if (!account || (account.id !== access.user!.id && account.createdByUserId !== access.user!.id)) {
		const lang = await getServerLang(request);
		const dict = getDictionary(lang);
		return NextResponse.json({ error: translate(dict, "server.accountNotFound") }, { status: 404 });
	}
	const rows = await db.select({
		id: mailboxes.id,
		localPart: mailboxes.localPart,
		displayName: mailboxes.displayName,
		domainId: mailboxes.domainId,
		hostname: domains.hostname,
	}).from(mailboxes).innerJoin(domains, eq(mailboxes.domainId, domains.id)).where(eq(mailboxes.userId, id));
	return NextResponse.json({ mailboxes: rows });
}
