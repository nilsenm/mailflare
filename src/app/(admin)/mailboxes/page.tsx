"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, KeyRound, Plus, UsersRound, X } from "lucide-react";
import { AccountNameField, AccountSecretFields } from "@/components/accounts/account-fields";
import { accountSecretPayload, apiErrorText, validateAccountSecretFields } from "@/components/accounts/account-fields-utils";
import { MakeIndependentDialog } from "@/components/mailboxes/make-independent-dialog";
import type { MakeIndependentTarget } from "@/components/mailboxes/make-independent-dialog-types";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SectionRowSkeleton } from "@/components/page-skeletons";
import { clearMailboxesCache } from "@/components/mailbox-provider-utils";
import { authFetch } from "@/lib/auth/client";
import { useT } from "@/lib/i18n/client";
import type { CreatedAccountResponse, Domain } from "./types";
import {
	fetchMailboxListRows,
	getMailboxAddress,
	getMailboxName,
	getMailboxRowAvatarUrl,
	getMailboxRowHref,
} from "./utils";

export default function MailboxesPage() {
	const { t } = useT();
	const qc = useQueryClient();
	const [displayName, setDisplayName] = useState("");
	const [localPart, setLocalPart] = useState("");
	const [domainId, setDomainId] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [resetEmail, setResetEmail] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [convertTarget, setConvertTarget] = useState<MakeIndependentTarget | null>(null);

	const domains = useQuery({
		queryKey: ["domains"],
		queryFn: async () => {
			const res = await authFetch("/api/domains");
			return (await res.json()) as { domains: Domain[] };
		},
	});

	const mailboxes = useQuery({
		queryKey: ["mailboxes", "overview"],
		queryFn: fetchMailboxListRows,
	});

	function resetForm() {
		setDisplayName("");
		setLocalPart("");
		setDomainId("");
		setPassword("");
		setConfirmPassword("");
		setResetEmail("");
		setFormError(null);
	}

	// Every new address is an independent account: same API as "Accounts".
	const create = useMutation({
		mutationFn: async () => {
			const res = await authFetch("/api/accounts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username: localPart.trim(),
					domainId,
					role: "user",
					...accountSecretPayload({ password, confirmPassword, resetEmail, displayName }),
				}),
			});
			const json = (await res.json().catch(() => ({}))) as CreatedAccountResponse;
			if (!res.ok || !json.account) throw new Error(apiErrorText(json.error, t("admin.mailboxes.createError")));
			return json.account;
		},
		onSuccess: (account) => {
			clearMailboxesCache();
			resetForm();
			setCreateOpen(false);
			setNotice(t("admin.mailboxes.createdMessage", { email: account.email, url: window.location.origin }));
			qc.invalidateQueries({ queryKey: ["mailboxes"] });
			qc.invalidateQueries({ queryKey: ["accounts"] });
		},
	});

	function submitCreate(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const problem = validateAccountSecretFields({ password, confirmPassword, resetEmail });
		if (problem) {
			setFormError(t(problem));
			return;
		}
		setFormError(null);
		create.mutate();
	}

	const domainMap = new Map(
		(domains.data?.domains ?? []).map((d) => [d.id, d.hostname]),
	);
	const rows = mailboxes.data ?? [];
	const hasPending = rows.some((row) => row.canMakeIndependent);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-3xl font-medium">{t("admin.mailboxes.title")}</h1>
				<Dialog
					open={createOpen}
					onOpenChange={(open) => {
						setCreateOpen(open);
						if (!open) setFormError(null);
					}}
				>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4" />
							{t("admin.mailboxes.newMailbox")}
						</Button>
					</DialogTrigger>
					<DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>{t("admin.mailboxes.dialogTitle")}</DialogTitle>
							<DialogDescription>{t("admin.mailboxes.dialogDescription")}</DialogDescription>
						</DialogHeader>
						<form onSubmit={submitCreate} className="space-y-4">
							<AccountNameField
								id="mailbox-name"
								value={displayName}
								onChange={setDisplayName}
								placeholder={localPart.trim() || t("admin.accountFields.namePlaceholder")}
								disabled={create.isPending}
							/>
							<div className="space-y-2">
								<Label htmlFor="mailbox-username">{t("admin.mailboxes.username")}</Label>
								<div className="flex h-10 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm shadow-neutral-200/50 focus-within:border-blue-600">
									<Input
										id="mailbox-username"
										value={localPart}
										onChange={(event) => setLocalPart(event.target.value)}
										placeholder={t("admin.accounts.username")}
										autoComplete="off"
										className="min-w-0 flex-1 rounded-none border-0 shadow-none focus-visible:border-0"
										disabled={create.isPending}
										required
									/>
									<span className="flex items-center text-sm text-neutral-400">@</span>
									<Select
										aria-label={t("admin.mailboxes.domain")}
										className="min-w-0 max-w-[55%] bg-transparent px-3 text-sm text-neutral-700 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
										value={domainId}
										onChange={(event) => setDomainId(event.target.value)}
										disabled={create.isPending}
										required
									>
										<option value="">{t("admin.mailboxes.selectDomain")}</option>
										{(domains.data?.domains ?? []).map((domain) => (
											<option key={domain.id} value={domain.id}>
												{domain.hostname}
											</option>
										))}
									</Select>
								</div>
							</div>
							<AccountSecretFields
								idPrefix="mailbox"
								password={password}
								confirmPassword={confirmPassword}
								resetEmail={resetEmail}
								onPasswordChange={setPassword}
								onConfirmPasswordChange={setConfirmPassword}
								onResetEmailChange={setResetEmail}
								disabled={create.isPending}
							/>
							{formError && <p className="text-sm text-red-600">{formError}</p>}
							{create.isError && !formError && (
								<p className="text-sm text-red-600">{(create.error as Error).message}</p>
							)}
							<Button
								type="submit"
								disabled={!domainId || !localPart.trim() || !password || !confirmPassword || create.isPending}
							>
								{create.isPending ? t("admin.mailboxes.creating") : t("admin.mailboxes.createAction")}
							</Button>
						</form>
					</DialogContent>
				</Dialog>
			</div>
			{notice && (
				<div className="flex items-start gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
					<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
					<p className="min-w-0 flex-1">{notice}</p>
					<button
						type="button"
						onClick={() => setNotice(null)}
						className="shrink-0 text-green-700 hover:text-green-900"
						aria-label={t("admin.mailboxes.dismiss")}
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			)}
			{hasPending && (
				<p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
					{t("admin.mailboxes.pendingHint")}
				</p>
			)}
			<section className="space-y-3">
				{mailboxes.isLoading && (
					<SectionRowSkeleton />
				)}
				{!mailboxes.isLoading && rows.length === 0 && (
					<p className="rounded-2xl bg-white px-5 py-4 text-sm text-neutral-500">
						{t("admin.mailboxes.empty")}
					</p>
				)}
				<div className="divide-y divide-neutral-100 overflow-hidden rounded-3xl bg-white">
					{rows.map((mailbox) => {
						const mailboxWithHostname = {
							...mailbox,
							hostname: mailbox.hostname ?? domainMap.get(mailbox.domainId) ?? "?",
						};
						const name = getMailboxName(mailboxWithHostname);
						const address = getMailboxAddress(mailboxWithHostname);
						const avatarUrl = getMailboxRowAvatarUrl(mailbox);

						return (
							<div
								key={mailbox.id}
								className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-blue-50/40"
							>
								<Link href={getMailboxRowHref(mailbox)} className="flex min-w-0 flex-1 items-center gap-4">
									<span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
										{name.trim().charAt(0).toUpperCase() || "?"}
										{avatarUrl && (
											<img
												src={avatarUrl}
												alt={t("admin.mailboxes.avatarAlt", { name })}
												className="absolute inset-0 h-full w-full object-cover"
												onError={(event) => event.currentTarget.remove()}
											/>
										)}
									</span>
									<span className="min-w-0">
										<span className="flex min-w-0 flex-wrap items-center gap-2">
											<span className="block truncate text-sm font-semibold text-neutral-900">
												{name}
											</span>
											{mailbox.type === "shared" && (
												<span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
													<UsersRound className="h-3 w-3" />
													{t("admin.mailboxes.badgeShared")}
												</span>
											)}
											{mailbox.ownership === "independent" && (
												<span className="inline-flex shrink-0 items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
													{t("admin.mailboxes.independentBadge")}
												</span>
											)}
											{mailbox.ownership === "inside" && mailbox.ownerEmail && (
												<span className="inline-flex min-w-0 items-center truncate rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
													{t("admin.mailboxes.insideAccount", { email: mailbox.ownerEmail })}
												</span>
											)}
										</span>
										<span className="block truncate no-font-mono text-sm text-neutral-500">
											{address}
										</span>
									</span>
								</Link>
								{mailbox.canMakeIndependent && (
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="shrink-0"
										onClick={() =>
											setConvertTarget({
												id: mailbox.id,
												address,
												displayName: mailbox.displayName,
												ownerEmail: mailbox.ownerEmail ?? "",
											})
										}
									>
										<KeyRound className="h-3.5 w-3.5" />
										{t("admin.mailboxes.makeIndependent")}
									</Button>
								)}
							</div>
						);
					})}
				</div>
			</section>
			<MakeIndependentDialog
				target={convertTarget}
				onOpenChange={(open) => {
					if (!open) setConvertTarget(null);
				}}
				onConverted={(account) => {
					clearMailboxesCache();
					setNotice(t("admin.mailboxes.madeIndependent", { email: account.email, url: window.location.origin }));
					qc.invalidateQueries({ queryKey: ["mailboxes"] });
					qc.invalidateQueries({ queryKey: ["accounts"] });
				}}
			/>
		</div>
	);
}
