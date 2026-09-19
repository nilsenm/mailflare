export type AccountNameFieldProps = {
	id: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
};

export type AccountSecretFieldsProps = {
	idPrefix: string;
	password: string;
	confirmPassword: string;
	resetEmail: string;
	onPasswordChange: (value: string) => void;
	onConfirmPasswordChange: (value: string) => void;
	onResetEmailChange: (value: string) => void;
	disabled?: boolean;
};
