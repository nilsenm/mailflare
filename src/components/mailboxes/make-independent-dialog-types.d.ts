export type MakeIndependentTarget = {
	id: string;
	address: string;
	displayName: string | null;
	ownerEmail: string;
};

export type IndependentAccount = {
	id: string;
	email: string;
	name: string;
};

export type MakeIndependentDialogProps = {
	target: MakeIndependentTarget | null;
	onOpenChange: (open: boolean) => void;
	onConverted: (account: IndependentAccount) => void;
};

export type MakeIndependentResponse = {
	account?: IndependentAccount;
	error?: unknown;
};
