/**
 * Pure rules for giving an existing mailbox its own password, i.e. turning it
 * into an independent account. A mailbox qualifies when it is personal and is
 * NOT the primary address of the account that owns it today: the primary one
 * already is an account with a password.
 *
 * Kept free of imports so `node --test` can load it straight from tests/.
 */
export type IndependentCandidate = {
	type?: string | null;
	localPart: string;
	hostname: string;
};

export type IndependentRejection = "not_found" | "not_personal" | "already_primary";

export type IndependentDecision =
	| { ok: true; email: string }
	| { ok: false; reason: IndependentRejection };

/** "independent": the mailbox is its owner's login address. "inside": it lives inside another account. */
export type MailboxOwnership = "independent" | "inside";

/** The login email of the account a mailbox becomes. */
export function independentAccountEmail(mailbox: Pick<IndependentCandidate, "localPart" | "hostname">): string {
	return `${mailbox.localPart}@${mailbox.hostname}`.trim().toLowerCase();
}

/** True when the mailbox address is the login email of its owner. */
export function isOwnersPrimaryMailbox(
	mailbox: Pick<IndependentCandidate, "localPart" | "hostname">,
	ownerEmail: string | null | undefined,
): boolean {
	if (!ownerEmail) return false;
	return independentAccountEmail(mailbox) === ownerEmail.trim().toLowerCase();
}

/** Decides whether a mailbox can be turned into an independent account. */
export function evaluateIndependentConversion(
	mailbox: IndependentCandidate | null | undefined,
	ownerEmail: string | null | undefined,
): IndependentDecision {
	if (!mailbox) return { ok: false, reason: "not_found" };
	if ((mailbox.type ?? "personal") !== "personal") return { ok: false, reason: "not_personal" };
	if (isOwnersPrimaryMailbox(mailbox, ownerEmail)) return { ok: false, reason: "already_primary" };
	return { ok: true, email: independentAccountEmail(mailbox) };
}

export function canMakeMailboxIndependent(
	mailbox: IndependentCandidate | null | undefined,
	ownerEmail: string | null | undefined,
): boolean {
	return evaluateIndependentConversion(mailbox, ownerEmail).ok;
}

export function mailboxOwnership(
	mailbox: Pick<IndependentCandidate, "localPart" | "hostname">,
	ownerEmail: string | null | undefined,
): MailboxOwnership {
	return isOwnersPrimaryMailbox(mailbox, ownerEmail) ? "independent" : "inside";
}

/** Account name: what the admin typed, else the mailbox display name, else the username. */
export function resolveIndependentAccountName(input: {
	displayName?: string | null;
	mailboxDisplayName?: string | null;
	localPart: string;
}): string {
	return input.displayName?.trim() || input.mailboxDisplayName?.trim() || input.localPart;
}

/** Name for a brand-new account: what the admin typed, else the username. */
export function resolveNewAccountName(displayName: string | null | undefined, username: string): string {
	return displayName?.trim() || username;
}
