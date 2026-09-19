/**
 * Client-side checks shared by every dialog that creates a sign-in: new
 * account, new mailbox and "give it its own password". The server validates
 * again with zod; these only give an early, translated message.
 *
 * Kept free of imports so `node --test` can load it straight from tests/.
 */
export const MIN_ACCOUNT_PASSWORD_LENGTH = 8;

export type AccountSecretFields = {
	password: string;
	confirmPassword: string;
	resetEmail: string;
};

export type AccountFieldsErrorKey =
	| "admin.accountFields.passwordTooShort"
	| "admin.accountFields.passwordMismatch"
	| "admin.accountFields.resetEmailInvalid";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidOptionalEmail(value: string): boolean {
	const trimmed = value.trim();
	return trimmed === "" || EMAIL_PATTERN.test(trimmed);
}

/** The first problem with the password / recovery email fields, as an i18n key, or null. */
export function validateAccountSecretFields(fields: AccountSecretFields): AccountFieldsErrorKey | null {
	if (fields.password.length < MIN_ACCOUNT_PASSWORD_LENGTH) return "admin.accountFields.passwordTooShort";
	if (fields.password !== fields.confirmPassword) return "admin.accountFields.passwordMismatch";
	if (!isValidOptionalEmail(fields.resetEmail)) return "admin.accountFields.resetEmailInvalid";
	return null;
}

/** API errors are a translated string, or a zod `flatten()` object on bad input. */
export function apiErrorText(error: unknown, fallback: string): string {
	return typeof error === "string" && error.trim() ? error : fallback;
}

/** Body fragment for the APIs: blank optional values are left out. */
export function accountSecretPayload(fields: AccountSecretFields & { displayName?: string }) {
	const displayName = fields.displayName?.trim() ?? "";
	const resetEmail = fields.resetEmail.trim();
	return {
		password: fields.password,
		...(displayName ? { displayName } : {}),
		...(resetEmail ? { resetEmail } : {}),
	};
}
