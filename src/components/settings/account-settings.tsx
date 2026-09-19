"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangePasswordForm } from "./change-password-form";
import { EmailClientsSettings } from "./email-clients-settings";
import { MfaSettings } from "./mfa-settings";
import { ForwardingEmailForm } from "./forwarding-email-form";
import { MailboxSignatureForm } from "./mailbox-signature-form";
import { ProfileForm } from "./profile-form";
import type { AccountSettingsResponse } from "./types";
import { loadAccountSettings } from "./utils";
import { LanguageSelector } from "@/components/language-selector";
import { useT } from "@/lib/i18n/client";

export function AccountSettings() {
	const { t } = useT();
	const [user, setUser] = useState<AccountSettingsResponse["user"]>();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		loadAccountSettings()
			.then((nextUser) => {
				if (!cancelled) setUser(nextUser);
			})
			.catch((err) => {
				if (!cancelled) setError(err instanceof Error ? err.message : t("errors.loadAccount"));
			});

		return () => {
			cancelled = true;
		};
	}, [t]);

	if (error) {
		return <p className="py-8 text-sm text-red-600">{error}</p>;
	}

	if (!user) {
		return (
			<div className="space-y-6 py-4">
				<Skeleton className="h-9 w-40" />
				<Skeleton className="h-72 w-full rounded-3xl" />
			</div>
		);
	}

	return (
		<div className="space-y-8 py-4">
			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">{t("settings.languageTitle")}</h2>
					<p className="mt-1 text-sm text-neutral-500">{t("settings.languageDescription")}</p>
				</div>
				<div className="rounded-3xl bg-white p-6"><LanguageSelector /></div>
			</section>
			{/* <div>
				<h1 className="text-3xl font-medium text-neutral-900">{t("settings.account.title")}</h1>
				<p className="mt-1 text-sm text-neutral-500">{t("settings.account.description")}</p>
			</div> */}

			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">{t("settings.accountDetails")}</h2>
					<p className="mt-1 text-sm text-neutral-500">{t("settings.accountDescription")}</p>
				</div>
				<div className="space-y-1 overflow-hidden rounded-3xl">
					<ProfileForm
						initialName={user.name}
						initialResetEmail={user.resetEmail ?? ""}
						email={user.email}
					/>

					{user.canForwardEmail && (
						<div className="space-y-4 rounded-lg bg-white p-6">
							<div>
								<h3 className="text-lg font-semibold text-neutral-900">{t("settings.forwardingEmail")}</h3>
								<p className="mt-1 text-sm text-neutral-500">{t("settings.forwardingDescription")}</p>
							</div>
						<ForwardingEmailForm initialForwardingEmail={user.forwardingEmail ?? ""} />
						</div>
					)}

					<div className="space-y-4 rounded-b-3xl rounded-t-lg bg-white p-6">
						<div>
							<h3 className="text-lg font-semibold text-neutral-900">{t("settings.emailSignature")}</h3>
							<p className="mt-1 text-sm text-neutral-500">{t("settings.signatureDescription")}</p>
						</div>
					<MailboxSignatureForm />
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">{t("settings.security")}</h2>
					<p className="mt-1 text-sm text-neutral-500">{t("settings.securityDescription")}</p>
				</div>
				<div className="space-y-4 rounded-3xl bg-white p-6">
					<div>
						<h3 className="text-lg font-semibold text-neutral-900">{t("settings.changePassword")}</h3>
						<p className="mt-1 text-sm text-neutral-500">{t("settings.passwordDescription")}</p>
					</div>
					<ChangePasswordForm />
				</div>
				<div className="space-y-4 rounded-3xl bg-white p-6">
					<div>
						<h3 className="text-lg font-semibold text-neutral-900">{t("auth.mfaTitle")}</h3>
						<p className="mt-1 text-sm text-neutral-500">{t("settings.mfaDescription")}</p>
					</div>
					<MfaSettings />
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">{t("settings.emailApps")}</h2>
					<p className="mt-1 text-sm text-neutral-500">{t("settings.emailAppsDescription")}</p>
				</div>
				<div className="space-y-4 rounded-3xl bg-white p-6">
					<EmailClientsSettings />
				</div>
			</section>
		</div>
	);
}
