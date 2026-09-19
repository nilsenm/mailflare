"use client";

import { useEffect, useState } from "react";
import { Copy, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MfaStatusResponse } from "./types";
import type { MfaDialogStep } from "./mfa-settings-types";
import { beginMfaEnrollment, confirmMfaEnrollment, disableMfa, loadMfaStatus, regenerateRecoveryCodes } from "./utils";
import { useT } from "@/lib/i18n/client";

/**
 * Settings > Account > Security card for TOTP. Enrolment is a three-step
 * dialog (password, scan and confirm, save recovery codes); turning it off
 * asks for both factors again.
 */
export function MfaSettings() {
	const { t } = useT();
	const [status, setStatus] = useState<MfaStatusResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [enrollOpen, setEnrollOpen] = useState(false);
	const [disableOpen, setDisableOpen] = useState(false);
	const [codesOpen, setCodesOpen] = useState(false);

	useEffect(() => {
		loadMfaStatus().then(setStatus).catch((err) => setError(err instanceof Error ? err.message : t("settings.mfa.loadFailed")));
	}, [t]);

	async function refresh() {
		setStatus(await loadMfaStatus());
	}

	if (!status) return <p className="text-sm text-neutral-500">{error ?? t("settings.mfa.loadingSettings")}</p>;

	return (
		<div className="space-y-4">
			<div className="flex items-start gap-3 rounded-2xl bg-neutral-50 p-4">
				{status.enabled ? (
					<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
				) : (
					<ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" />
				)}
				<div className="min-w-0 flex-1">
					<p className="text-sm font-medium text-neutral-900">
						{status.enabled ? t("settings.mfa.onStatus") : t("settings.mfa.offStatus")}
					</p>
					<p className="mt-1 text-sm text-neutral-500">
						{status.enabled
							? `${t("settings.mfa.signInAsksForCode")} ${t("settings.mfa.recoveryCodesLeft", { count: status.recoveryCodesLeft })}`
							: t("settings.mfa.offDescription")}
					</p>
				</div>
			</div>
			<div className="flex flex-wrap gap-3">
				{status.enabled ? (
					<>
						<Button variant="outline" onClick={() => setCodesOpen(true)}>
							{t("settings.mfa.newRecoveryCodes")}
						</Button>
						<Button variant="outline" onClick={() => setDisableOpen(true)}>
							{t("settings.mfa.turnOff")}
						</Button>
					</>
				) : (
					<Button onClick={() => setEnrollOpen(true)}>{t("settings.mfa.turnOnTwoFactor")}</Button>
				)}
			</div>

			<EnrollDialog open={enrollOpen} onOpenChange={setEnrollOpen} onDone={refresh} />
			<DisableDialog open={disableOpen} onOpenChange={setDisableOpen} onDone={refresh} />
			<RecoveryCodesDialog open={codesOpen} onOpenChange={setCodesOpen} onDone={refresh} />
		</div>
	);
}

function RecoveryCodesList({ codes }: { codes: string[] }) {
	const { t } = useT();
	const [copied, setCopied] = useState(false);
	return (
		<div className="space-y-3">
			<ul className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-50 p-4 font-mono text-sm text-neutral-800">
				{codes.map((code) => (
					<li key={code}>{code}</li>
				))}
			</ul>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => {
					void navigator.clipboard.writeText(codes.join("\n")).then(() => setCopied(true));
				}}
			>
				<Copy className="h-4 w-4" />
				{copied ? t("settings.copied") : t("settings.mfa.copyCodes")}
			</Button>
			<p className="text-xs text-neutral-500">
				{t("settings.mfa.recoveryCodesHint")}
			</p>
		</div>
	);
}

function EnrollDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; onDone: () => Promise<void> }) {
	const { t } = useT();
	const [step, setStep] = useState<MfaDialogStep>("password");
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [qrSvg, setQrSvg] = useState("");
	const [secret, setSecret] = useState("");
	const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	function reset() {
		setStep("password");
		setPassword("");
		setCode("");
		setQrSvg("");
		setSecret("");
		setRecoveryCodes([]);
		setError(null);
	}

	async function start(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		setError(null);
		try {
			const enrollment = await beginMfaEnrollment(password);
			setQrSvg(enrollment.qrSvg);
			setSecret(enrollment.secret);
			setStep("scan");
		} catch (err) {
			setError(err instanceof Error ? err.message : t("settings.mfa.couldNotStart"));
		} finally {
			setBusy(false);
		}
	}

	async function confirm(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		setError(null);
		try {
			setRecoveryCodes(await confirmMfaEnrollment(code));
			setStep("codes");
			await onDone();
		} catch (err) {
			setError(err instanceof Error ? err.message : t("settings.mfa.couldNotConfirm"));
		} finally {
			setBusy(false);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next);
				if (!next) reset();
			}}
		>
			<DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-[480px]">
				{step === "password" && (
					<form onSubmit={start} className="space-y-4">
						<DialogHeader>
							<DialogTitle>{t("settings.mfa.enrollTitle")}</DialogTitle>
							<DialogDescription>{t("settings.mfa.enrollConfirmPassword")}</DialogDescription>
						</DialogHeader>
						<div className="space-y-2">
							<Label htmlFor="mfa-password">{t("auth.password")}</Label>
							<Input id="mfa-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
						</div>
						{error && <p className="text-sm text-red-600">{error}</p>}
						<Button type="submit" disabled={busy}>{busy ? t("settings.mfa.pleaseWait") : t("settings.mfa.continue")}</Button>
					</form>
				)}
				{step === "scan" && (
					<form onSubmit={confirm} className="space-y-4">
						<DialogHeader>
							<DialogTitle>{t("settings.mfa.scanTitle")}</DialogTitle>
							<DialogDescription>{t("settings.mfa.scanDescription")}</DialogDescription>
						</DialogHeader>
						<div className="mx-auto w-48 rounded-xl border border-neutral-200 bg-white p-2" dangerouslySetInnerHTML={{ __html: qrSvg }} />
						<details className="text-xs text-neutral-500">
							<summary className="cursor-pointer">{t("settings.mfa.cantScan")}</summary>
							<code className="mt-2 block break-all rounded-md bg-neutral-50 p-2 font-mono text-neutral-800">{secret}</code>
						</details>
						<div className="space-y-2">
							<Label htmlFor="mfa-code">{t("settings.mfa.sixDigitCode")}</Label>
							<Input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123 456" required autoFocus />
						</div>
						{error && <p className="text-sm text-red-600">{error}</p>}
						<Button type="submit" disabled={busy}>{busy ? t("settings.mfa.checking") : t("settings.mfa.verifyAndTurnOn")}</Button>
					</form>
				)}
				{step === "codes" && (
					<div className="space-y-4">
						<DialogHeader>
							<DialogTitle>{t("settings.mfa.saveCodesTitle")}</DialogTitle>
							<DialogDescription>{t("settings.mfa.saveCodesDescription")}</DialogDescription>
						</DialogHeader>
						<RecoveryCodesList codes={recoveryCodes} />
						<Button type="button" onClick={() => onOpenChange(false)}>{t("settings.mfa.done")}</Button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

function DisableDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; onDone: () => Promise<void> }) {
	const { t } = useT();
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		setError(null);
		try {
			await disableMfa(password, code);
			await onDone();
			onOpenChange(false);
			setPassword("");
			setCode("");
		} catch (err) {
			setError(err instanceof Error ? err.message : t("settings.mfa.couldNotTurnOff"));
		} finally {
			setBusy(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-[480px]">
				<form onSubmit={submit} className="space-y-4">
					<DialogHeader>
						<DialogTitle>{t("settings.mfa.turnOffTitle")}</DialogTitle>
						<DialogDescription>{t("settings.mfa.turnOffConfirm")}</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="mfa-off-password">{t("auth.password")}</Label>
						<Input id="mfa-off-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
					</div>
					<div className="space-y-2">
						<Label htmlFor="mfa-off-code">{t("auth.code")}</Label>
						<Input id="mfa-off-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required />
					</div>
					{error && <p className="text-sm text-red-600">{error}</p>}
					<Button type="submit" variant="destructive" disabled={busy}>{busy ? t("settings.mfa.pleaseWait") : t("settings.mfa.turnOff")}</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function RecoveryCodesDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; onDone: () => Promise<void> }) {
	const { t } = useT();
	const [password, setPassword] = useState("");
	const [codes, setCodes] = useState<string[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		setError(null);
		try {
			setCodes(await regenerateRecoveryCodes(password));
			setPassword("");
			await onDone();
		} catch (err) {
			setError(err instanceof Error ? err.message : t("settings.mfa.couldNotGenerateCodes"));
		} finally {
			setBusy(false);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next);
				if (!next) setCodes(null);
			}}
		>
			<DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-[480px]">
				{codes ? (
					<div className="space-y-4">
						<DialogHeader>
							<DialogTitle>{t("settings.mfa.newCodesTitle")}</DialogTitle>
							<DialogDescription>{t("settings.mfa.previousCodesInvalid")}</DialogDescription>
						</DialogHeader>
						<RecoveryCodesList codes={codes} />
						<Button type="button" onClick={() => onOpenChange(false)}>{t("settings.mfa.done")}</Button>
					</div>
				) : (
					<form onSubmit={submit} className="space-y-4">
						<DialogHeader>
							<DialogTitle>{t("settings.mfa.generateTitle")}</DialogTitle>
							<DialogDescription>{t("settings.mfa.generateDescription")}</DialogDescription>
						</DialogHeader>
						<div className="space-y-2">
							<Label htmlFor="rc-password">{t("auth.password")}</Label>
							<Input id="rc-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
						</div>
						{error && <p className="text-sm text-red-600">{error}</p>}
						<Button type="submit" disabled={busy}>{busy ? t("settings.mfa.pleaseWait") : t("settings.mfa.generate")}</Button>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
