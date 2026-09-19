import { authFetch } from "@/lib/auth/client";
import type { Mailbox, MailboxListRow, MailboxOverviewResponse, MailboxesResponse } from "./types";

/**
 * Every mailbox on the admin's domains with its owner. Without the Team admin
 * view (403) it falls back to the admin's own mailboxes, without owner labels.
 */
export async function fetchMailboxListRows(): Promise<MailboxListRow[]> {
	const overview = await authFetch("/api/mailboxes/overview");
	if (overview.ok) {
		const json = (await overview.json()) as MailboxOverviewResponse;
		return json.mailboxes ?? [];
	}
	const res = await authFetch("/api/mailboxes");
	const json = (await res.json()) as Partial<Pick<MailboxesResponse, "canCreateShared">> & {
		mailboxes?: (Mailbox & { userId?: string })[];
	};
	return (json.mailboxes ?? []).map((mailbox) => ({
		...mailbox,
		userId: mailbox.userId ?? null,
		ownerEmail: null,
		ownedByMe: true,
		ownership: null,
		canMakeIndependent: false,
	}));
}

/** Own mailboxes open their settings; mailboxes of other accounts open that account. */
export function getMailboxRowHref(row: Pick<MailboxListRow, "id" | "userId" | "ownedByMe">): string {
	if (row.ownedByMe || !row.userId) return `/mailboxes/${row.id}`;
	return `/accounts/${row.userId}`;
}

export function getMailboxRowAvatarUrl(
	row: Pick<MailboxListRow, "id" | "userId" | "ownedByMe" | "ownership" | "hasAvatar">,
): string | null {
	if (!row.hasAvatar) return null;
	if (row.ownedByMe) return `/api/mailboxes/${row.id}/avatar`;
	if (row.ownership === "independent" && row.userId) return `/api/accounts/${row.userId}/avatar`;
	return null;
}

export function getMailboxAddress(mailbox: Pick<Mailbox, "localPart" | "hostname">): string {
	return `${mailbox.localPart}@${mailbox.hostname}`;
}

export function getMailboxName(mailbox: Pick<Mailbox, "displayName" | "localPart">): string {
	return mailbox.displayName?.trim() || mailbox.localPart;
}
