"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmPasswordReset } from "./utils";
import { useT } from "@/lib/i18n/client";

export function ResetPasswordClient() {
	const { t } = useT();
	const token = useSearchParams().get("token") ?? "";
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (password !== confirm) {
			setError(t("auth.resetPassword.mismatch"));
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const result = await confirmPasswordReset(token, password);
			if (!result.ok) {
				setError(result.error ?? t("auth.resetPassword.couldNotReset"));
				return;
			}
			setDone(true);
		} catch {
			setError(t("auth.serverUnavailable"));
		} finally {
			setLoading(false);
		}
	}

	if (!token) {
		return (
			<AuthShell icon={LockKeyhole} title={t("auth.resetPassword.linkMissingTitle")} description={t("auth.resetPassword.linkMissingDescription")}>
				<Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
					{t("auth.resetPassword.requestNewLink")}
				</Link>
			</AuthShell>
		);
	}

	return (
		<AuthShell
			icon={LockKeyhole}
			title={done ? t("auth.resetPassword.updatedTitle") : t("auth.resetPassword.chooseTitle")}
			description={
				done
					? t("auth.resetPassword.updatedDescription")
					: t("auth.resetPassword.chooseDescription")
			}
			footer={
				done ? (
					<Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
						{t("auth.resetPassword.goToSignIn")}
					</Link>
				) : undefined
			}
		>
			{!done && (
				<form onSubmit={onSubmit} className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="password">{t("auth.resetPassword.newPassword")}</Label>
						<Input
							id="password"
							type="password"
							autoComplete="new-password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							minLength={8}
							required
							autoFocus
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirm">{t("auth.resetPassword.confirmNewPassword")}</Label>
						<Input
							id="confirm"
							type="password"
							autoComplete="new-password"
							value={confirm}
							onChange={(event) => setConfirm(event.target.value)}
							minLength={8}
							required
						/>
					</div>
					{error && (
						<p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
					)}
					<Button type="submit" className="h-11 w-full rounded-full px-6 active:scale-[0.98]" disabled={loading}>
						{loading ? t("auth.resetPassword.saving") : t("auth.resetPassword.setNewPassword")}
					</Button>
				</form>
			)}
		</AuthShell>
	);
}
