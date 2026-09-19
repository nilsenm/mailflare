"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/client";
import type { AccountNameFieldProps, AccountSecretFieldsProps } from "./account-fields-types";
import { MIN_ACCOUNT_PASSWORD_LENGTH } from "./account-fields-utils";

/** "Display name" input shared by the account-creating dialogs. */
export function AccountNameField({ id, value, onChange, placeholder, disabled }: AccountNameFieldProps) {
	const { t } = useT();
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{t("admin.accountFields.name")}</Label>
			<Input
				id={id}
				value={value}
				maxLength={100}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder ?? t("admin.accountFields.namePlaceholder")}
				disabled={disabled}
			/>
		</div>
	);
}

/** Password + confirmation (with show/hide) and the optional recovery email. */
export function AccountSecretFields({
	idPrefix,
	password,
	confirmPassword,
	resetEmail,
	onPasswordChange,
	onConfirmPasswordChange,
	onResetEmailChange,
	disabled,
}: AccountSecretFieldsProps) {
	const { t } = useT();
	const [visible, setVisible] = useState(false);
	const type = visible ? "text" : "password";
	return (
		<>
			<div className="space-y-2">
				<Label htmlFor={`${idPrefix}-password`}>{t("admin.accountFields.password")}</Label>
				<div className="relative">
					<Input
						id={`${idPrefix}-password`}
						type={type}
						autoComplete="new-password"
						minLength={MIN_ACCOUNT_PASSWORD_LENGTH}
						maxLength={128}
						value={password}
						onChange={(event) => onPasswordChange(event.target.value)}
						className="pr-10"
						disabled={disabled}
						required
					/>
					<button
						type="button"
						onClick={() => setVisible((current) => !current)}
						className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-500 hover:text-neutral-800"
						aria-label={visible ? t("admin.accountFields.hidePassword") : t("admin.accountFields.showPassword")}
						title={visible ? t("admin.accountFields.hidePassword") : t("admin.accountFields.showPassword")}
					>
						{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
					</button>
				</div>
				<p className="text-xs text-neutral-500">{t("admin.accountFields.passwordHint")}</p>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${idPrefix}-confirm-password`}>{t("admin.accountFields.confirmPassword")}</Label>
				<Input
					id={`${idPrefix}-confirm-password`}
					type={type}
					autoComplete="new-password"
					minLength={MIN_ACCOUNT_PASSWORD_LENGTH}
					maxLength={128}
					value={confirmPassword}
					onChange={(event) => onConfirmPasswordChange(event.target.value)}
					disabled={disabled}
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${idPrefix}-reset-email`}>{t("admin.accountFields.resetEmail")}</Label>
				<Input
					id={`${idPrefix}-reset-email`}
					type="email"
					autoComplete="off"
					value={resetEmail}
					onChange={(event) => onResetEmailChange(event.target.value)}
					placeholder={t("admin.accountFields.resetEmailPlaceholder")}
					disabled={disabled}
				/>
				<p className="text-xs text-neutral-500">{t("admin.accountFields.resetEmailHint")}</p>
			</div>
		</>
	);
}
