import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { domains, mailboxes, users } from "@/db/schema";
import { requireTeamAdmin } from "@/app/api/accounts/utils";
import { canMakeMailboxIndependent, mailboxOwnership } from "@/lib/mailboxes/independent-utils";
import { tracksAccountIdentity } from "@/lib/profile/identity-utils";

/**
 * Admin view of every mailbox on the admin's domains, whoever owns it, so the
 * list can tell independent accounts apart from mailboxes still living inside
 * another account.
 */
export async function GET(request: Request) {
	const access = await requireTeamAdmin(request);
	if (access.error) return access.error;
	const adminId = access.user!.id;
	const rows = await getDb(access.env)
		.select({
			id: mailboxes.id,
			userId: mailboxes.userId,
			domainId: mailboxes.domainId,
			localPart: mailboxes.localPart,
			displayName: mailboxes.displayName,
			avatarKey: mailboxes.avatarKey,
			type: mailboxes.type,
			hostname: domains.hostname,
			ownerEmail: users.email,
			ownerName: users.name,
			ownerAvatarKey: users.avatarKey,
		})
		.from(mailboxes)
		.innerJoin(domains, eq(mailboxes.domainId, domains.id))
		.innerJoin(users, eq(mailboxes.userId, users.id))
		.where(and(eq(domains.userId, adminId), eq(mailboxes.disabled, false)))
		.orderBy(asc(domains.hostname), asc(mailboxes.localPart));

	return NextResponse.json({
		mailboxes: rows.map((row) => {
			const { avatarKey, ownerAvatarKey, ownerName, ...mailbox } = row;
			const identity = tracksAccountIdentity(row, row.ownerEmail);
			return {
				...mailbox,
				displayName: identity ? ownerName : row.displayName,
				hasAvatar: identity ? !!ownerAvatarKey : !!avatarKey,
				ownedByMe: row.userId === adminId,
				ownership: mailboxOwnership(row, row.ownerEmail),
				canMakeIndependent: canMakeMailboxIndependent(row, row.ownerEmail),
			};
		}),
	});
}
