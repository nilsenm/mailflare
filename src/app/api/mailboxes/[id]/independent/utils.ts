import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { calendarEvents, domains, folders, mailboxAccess, mailboxes, messages, routingRules, users } from "@/db/schema";
import type { IndependentMailboxRow, NewIndependentAccount } from "./types";

/** The mailbox with its address and current owner, limited to the admin's own domains. */
export async function selectMailboxForConversion(
	db: AppDatabase,
	mailboxId: string,
	adminUserId: string,
): Promise<IndependentMailboxRow | null> {
	const [row] = await db
		.select({
			id: mailboxes.id,
			userId: mailboxes.userId,
			localPart: mailboxes.localPart,
			displayName: mailboxes.displayName,
			avatarKey: mailboxes.avatarKey,
			type: mailboxes.type,
			hostname: domains.hostname,
			ownerEmail: users.email,
		})
		.from(mailboxes)
		.innerJoin(domains, eq(mailboxes.domainId, domains.id))
		.innerJoin(users, eq(mailboxes.userId, users.id))
		.where(and(eq(mailboxes.id, mailboxId), eq(domains.userId, adminUserId)))
		.limit(1);
	return row ?? null;
}

/**
 * Creates the account and hands the mailbox over to it in one atomic batch
 * (D1 batch on Workers, BEGIN/COMMIT over better-sqlite3 on the Node runtime).
 *
 * Every row that belongs to THIS mailbox and to its previous owner follows the
 * mailbox: folders, mailbox-scope rules, calendar events and the ownership
 * column of its messages (drafts and a few list fallbacks filter by it). The
 * messages themselves never move: they stay attached to the same mailbox id.
 * Grants that gave the previous owner delegated access to it are dropped.
 */
export async function convertMailboxToAccount(
	db: AppDatabase,
	mailbox: Pick<IndependentMailboxRow, "id" | "userId">,
	account: NewIndependentAccount,
) {
	const previousOwnerId = mailbox.userId;
	const [created] = await db.batch([
		db
			.insert(users)
			.values({
				id: account.id,
				email: account.email,
				passwordHash: account.passwordHash,
				name: account.name,
				avatarKey: account.avatarKey,
				role: "user",
				createdByUserId: account.createdByUserId,
				resetEmail: account.resetEmail,
			})
			.returning({
				id: users.id,
				email: users.email,
				name: users.name,
				resetEmail: users.resetEmail,
				role: users.role,
				disabled: users.disabled,
				avatarKey: users.avatarKey,
				canManageMailboxes: users.canManageMailboxes,
				createdAt: users.createdAt,
			}),
		db
			.update(mailboxes)
			.set({ userId: account.id })
			.where(and(eq(mailboxes.id, mailbox.id), eq(mailboxes.userId, previousOwnerId))),
		db
			.update(folders)
			.set({ userId: account.id })
			.where(and(eq(folders.mailboxId, mailbox.id), eq(folders.userId, previousOwnerId))),
		db
			.update(routingRules)
			.set({ userId: account.id })
			.where(
				and(
					eq(routingRules.mailboxId, mailbox.id),
					eq(routingRules.userId, previousOwnerId),
					eq(routingRules.scope, "mailbox"),
				),
			),
		db
			.update(calendarEvents)
			.set({ userId: account.id })
			.where(and(eq(calendarEvents.mailboxId, mailbox.id), eq(calendarEvents.userId, previousOwnerId))),
		db
			.update(messages)
			.set({ userId: account.id })
			.where(and(eq(messages.mailboxId, mailbox.id), eq(messages.userId, previousOwnerId))),
		db
			.delete(mailboxAccess)
			.where(and(eq(mailboxAccess.mailboxId, mailbox.id), eq(mailboxAccess.userId, previousOwnerId))),
	]);
	return created[0] ?? null;
}
