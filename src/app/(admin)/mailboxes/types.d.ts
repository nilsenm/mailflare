export type Mailbox = {
	id: string;
	localPart: string;
	displayName: string | null;
	hasAvatar?: boolean;
	domainId: string;
	hostname: string;
	type?: "personal" | "shared";
	permission?: "read_only" | "send_as" | "send_on_behalf" | "full_access";
	isPrimary?: boolean;
};

export type Domain = {
	id: string;
	hostname: string;
};

export type CurrentAccountResponse = {
	user?: {
		id?: string;
		email?: string;
		name?: string | null;
	};
};

export type MailboxOwner = {
	id: string;
	email: string;
	name: string;
	role: "admin" | "user";
};

export type MailboxesResponse = {
	mailboxes: Mailbox[];
	canCreateShared: boolean;
};

/** Row of the admin list: every mailbox on the admin's domains, with its owner. */
export type MailboxListRow = Mailbox & {
	userId: string | null;
	ownerEmail: string | null;
	ownedByMe: boolean;
	ownership: "independent" | "inside" | null;
	canMakeIndependent: boolean;
};

export type MailboxOverviewResponse = {
	mailboxes?: MailboxListRow[];
	error?: string;
};

export type CreatedAccountResponse = {
	account?: { id: string; email: string; name: string };
	error?: unknown;
};
