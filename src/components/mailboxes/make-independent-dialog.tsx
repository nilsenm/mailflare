"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { AccountNameField, AccountSecretFields } from "@/components/accounts/account-fields";
import { accountSecretPayload, apiErrorText, validateAccountSecretFields } from "@/components/accounts/account-fields-utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authFetch } from "@/lib/auth/client";
import { useT } from "@/lib/i18n/client";
import type { IndependentAccount, MakeIndependentDialogProps, MakeIndependentResponse } from "./make-independent-dialog-types";

/** "Give it its own password": turns a mailbox inside another account into an independent account. */
export function MakeIndependentDialog(props: MakeIndependentDialogProps) {
	// Remounting per target starts every conversion with empty fields.
	return <MakeIndependentForm key={props.target?.id ?? "closed"} {...props} />;
}

function MakeIndependentForm({ target, onOpenChange, onConverted }: MakeIndependentDialogProps) {
	const { t } = useT();
	const [displayName, setDisplayName] = useState(target?.displayName ?? "");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [resetEmail, setResetEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [done, setDone] = useState<IndependentAccount | null>(null);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!target) return;
		const problem = validateAccountSecretFields({ password, confirmPassword, resetEmail });
		if (problem) {
			setError(t(problem));
			return;
		}
		setSaving(true);
		setError(null);
		try {
			const response = await authFetch(`/api/mailboxes/${target.id}/independent`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(accountSecretPayload({ password, confirmPassword, resetEmail, displayName })),
			});
			const data = (await response.json().catch(() => ({}))) as MakeIndependentResponse;
			if (!response.ok || !data.account) {
				throw new Error(apiErrorText(data.error, t("admin.mailboxes.makeIndependentError")));
			}
			setPassword("");
			setConfirmPassword("");
			setDone(data.account);
			onConverted(data.account);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : t("admin.mailboxes.makeIndependentError"));
		} finally {
			setSaving(false);
		}
	}

	const address = target?.address ?? "";

	return (
		<Dialog open={!!target} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("admin.mailboxes.makeIndependentTitle", { address })}</DialogTitle>
					<DialogDescription>
						{t("admin.mailboxes.makeIndependentDescription", { address, owner: target?.ownerEmail ?? "" })}
					</DialogDescription>
				</DialogHeader>
				{done ? (
					<div className="space-y-4">
						<p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
							{t("admin.mailboxes.madeIndependent", { email: done.email, url: window.location.origin })}
						</p>
						<Button type="button" onClick={() => onOpenChange(false)}>
							{t("admin.mailboxes.close")}
						</Button>
					</div>
				) : (
					<form onSubmit={submit} className="space-y-4">
						<AccountNameField
							id="independent-name"
							value={displayName}
							onChange={setDisplayName}
							placeholder={target?.displayName || address.split("@")[0]}
							disabled={saving}
						/>
						<AccountSecretFields
							idPrefix="independent"
							password={password}
							confirmPassword={confirmPassword}
							resetEmail={resetEmail}
							onPasswordChange={setPassword}
							onConfirmPasswordChange={setConfirmPassword}
							onResetEmailChange={setResetEmail}
							disabled={saving}
						/>
						{error && <p className="text-sm text-red-600">{error}</p>}
						<Button type="submit" disabled={saving || !password || !confirmPassword}>
							<KeyRound className="h-4 w-4" />
							{saving ? t("admin.mailboxes.makingIndependent") : t("admin.mailboxes.makeIndependentAction")}
						</Button>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
