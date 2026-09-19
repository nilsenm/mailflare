export type IndependentMailboxRow = {
	id: string;
	userId: string;
	localPart: string;
	displayName: string | null;
	avatarKey: string | null;
	type: "personal" | "shared";
	hostname: string;
	ownerEmail: string;
};

export type NewIndependentAccount = {
	id: string;
	email: string;
	passwordHash: string;
	name: string;
	avatarKey: string | null;
	resetEmail: string | null;
	createdByUserId: string;
};
