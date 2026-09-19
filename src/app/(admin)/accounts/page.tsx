"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { authFetch } from "@/lib/auth/client";
import { LicenseRequiredOverlay } from "@/components/license-required-overlay";
import { AccountNameField, AccountSecretFields } from "@/components/accounts/account-fields";
import { accountSecretPayload, apiErrorText, validateAccountSecretFields } from "@/components/accounts/account-fields-utils";
import { useT } from "@/lib/i18n/client";
import type { Account, AccountResponse, Domain } from "./types";

export default function AccountsPage() {
	const { t } = useT();
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [domains, setDomains] = useState<Domain[]>([]);
	const [username, setUsername] = useState("");
	const [domainId, setDomainId] = useState("");
	const [role, setRole] = useState<"admin" | "user">("user");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [resetEmail, setResetEmail] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [teamRequired, setTeamRequired] = useState(false);

	async function loadAccounts() {
		const response = await authFetch("/api/accounts");
		const data = (await response.json()) as AccountResponse;
		if (!response.ok) {
			if (response.status === 403) setTeamRequired(true);
			throw new Error(data.error ?? t("admin.accounts.loadError"));
		}
		setAccounts(data.accounts ?? []);
	}

	useEffect(() => {
		loadAccounts().then(async () => {
			const response = await authFetch("/api/domains");
			const data = (await response.json()) as { domains?: Domain[]; error?: string };
			if (!response.ok) throw new Error(data.error ?? t("admin.accounts.domainsError"));
			setDomains(data.domains ?? []);
			setDomainId(data.domains?.[0]?.id ?? "");
		}).catch((error) => {
			const text = error instanceof Error ? error.message : t("admin.accounts.loadError");
			if (/team/i.test(text)) setTeamRequired(true);
			setMessage(text);
		}).finally(() => setLoading(false));
	}, [t]);

	async function createAccount(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const problem = validateAccountSecretFields({ password, confirmPassword, resetEmail });
		if (problem) {
			setMessage(t(problem));
			return;
		}
		setSaving(true);
		setMessage(null);
		try {
			const response = await authFetch("/api/accounts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username,
					domainId,
					role,
					...accountSecretPayload({ password, confirmPassword, resetEmail, displayName }),
				}),
			});
			const data = (await response.json()) as Omit<AccountResponse, "error"> & { error?: unknown };
			if (!response.ok) throw new Error(apiErrorText(data.error, t("admin.accounts.createError")));
			setUsername("");
			setPassword("");
			setConfirmPassword("");
			setDisplayName("");
			setResetEmail("");
			setCreateOpen(false);
			await loadAccounts();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : t("admin.accounts.createError"));
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-medium text-neutral-900">{t("admin.accounts.title")}</h1>
					<p className="mt-2 text-sm text-neutral-500">{t("admin.accounts.description")}</p>
				</div>
				{!teamRequired && (
					<Button onClick={() => setCreateOpen(true)}>
						<Plus className="h-4 w-4" />
						{t("admin.accounts.newAccount")}
					</Button>
				)}
			</div>
			<div className="relative">
				{teamRequired && (
					<LicenseRequiredOverlay required="Team">
						<div className="min-h-48 rounded-3xl bg-white" />
					</LicenseRequiredOverlay>
				)}
				<div className="grid gap-3">
					{loading && <p className="text-sm text-neutral-500">{t("admin.accounts.loading")}</p>}
					{accounts.map((account) => (
						<Link
							key={account.id}
							href={`/accounts/${account.id}`}
							className="flex items-center gap-4 rounded-3xl bg-white p-5 transition-colors hover:bg-blue-50/40"
						>
							<span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-semibold text-blue-700">
								{account.name.charAt(0).toUpperCase()}
								{account.hasAvatar && (
									<img
										src={`/api/accounts/${account.id}/avatar`}
										alt=""
										className="absolute inset-0 h-full w-full object-cover"
									/>
								)}
							</span>
							<span className="min-w-0">
								<span className="flex items-center gap-2">
									<span className="truncate font-semibold text-neutral-900">{account.name}</span>
									<span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize text-neutral-600">
										{account.role === "admin" ? t("admin.accounts.roleAdmin") : t("admin.accounts.roleUser")}
									</span>
								</span>
								<span className="block truncate text-sm text-neutral-500">{account.email}</span>
							</span>
						</Link>
					))}
				</div>
			</div>
			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("admin.accounts.dialogTitle")}</DialogTitle>
						<DialogDescription>{t("admin.accounts.dialogDescription")}</DialogDescription>
					</DialogHeader>
					<form onSubmit={createAccount} className="space-y-4">
						<AccountNameField
							id="account-display-name"
							value={displayName}
							onChange={setDisplayName}
							placeholder={username.trim() || t("admin.accountFields.namePlaceholder")}
							disabled={saving}
						/>
						<div className="space-y-2">
							<Label htmlFor="account-username">{t("admin.accounts.email")}</Label>
							<div className="flex h-10 overflow-hidden rounded-md border border-neutral-200 bg-white">
								<Input
									id="account-username"
									value={username}
									onChange={(event) => setUsername(event.target.value)}
									placeholder={t("admin.accounts.username")}
									className="min-w-0 flex-1 rounded-none border-0 shadow-none"
									required
								/>
								<span className="flex items-center text-sm text-neutral-400">@</span>
								<Select
									aria-label={t("admin.accounts.domainAria")}
									value={domainId}
									onChange={(event) => setDomainId(event.target.value)}
									className="max-w-[55%] bg-transparent px-3 text-sm"
									required
								>
									<option value="">{t("admin.accounts.selectDomain")}</option>
									{domains.map((domain) => (
										<option key={domain.id} value={domain.id}>
											{domain.hostname}
										</option>
									))}
								</Select>
							</div>
						</div>
						<AccountSecretFields
							idPrefix="account"
							password={password}
							confirmPassword={confirmPassword}
							resetEmail={resetEmail}
							onPasswordChange={setPassword}
							onConfirmPasswordChange={setConfirmPassword}
							onResetEmailChange={setResetEmail}
							disabled={saving}
						/>
						<div className="space-y-2">
							<Label htmlFor="account-role">{t("admin.accounts.role")}</Label>
							<Select
								id="account-role"
								value={role}
								onChange={(event) => setRole(event.target.value as "admin" | "user")}
								className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
							>
								<option value="user">{t("admin.accounts.roleUser")}</option>
								<option value="admin">{t("admin.accounts.roleAdmin")}</option>
							</Select>
						</div>
						{message && <p className="text-sm text-red-600">{message}</p>}
						<Button type="submit" disabled={saving || !domainId}>
							{saving ? t("admin.accounts.creating") : t("admin.accounts.createAction")}
						</Button>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
