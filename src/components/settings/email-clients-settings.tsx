"use client";

import { useState } from "react";
import { Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createJmapApiKey } from "./utils";
import { useT } from "@/lib/i18n/client";

/**
 * Settings > Account card for connecting an external mail app over JMAP.
 * Mints an API key with the `jmap` scope and shows the details once.
 */
export function EmailClientsSettings() {
	const { t } = useT();
	const [name, setName] = useState("");
	const [key, setKey] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [copied, setCopied] = useState<string | null>(null);
	const server = typeof window !== "undefined" ? window.location.origin : "";

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		setError(null);
		try {
			setKey(await createJmapApiKey(name.trim() || "Mail app"));
			setName("");
		} catch (err) {
			setError(err instanceof Error ? err.message : t("settings.emailClients.createKeyFailed"));
		} finally {
			setBusy(false);
		}
	}

	function copy(label: string, value: string) {
		void navigator.clipboard.writeText(value).then(() => setCopied(label));
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-neutral-500">
				{t("settings.emailClients.description")}
			</p>
			{key ? (
				<div className="space-y-3 rounded-2xl bg-neutral-50 p-4">
					<Field label={t("settings.emailClients.server")} value={server} onCopy={copy} copied={copied} copyLabel={t("settings.copy")} copiedLabel={t("settings.copied")} copyAria={t("settings.emailClients.copyAria", { label: t("settings.emailClients.server") })} />
					<Field label={t("settings.emailClients.username")} value={t("settings.emailClients.usernameValue")} onCopy={copy} copied={copied} copyLabel={t("settings.copy")} copiedLabel={t("settings.copied")} copyAria={t("settings.emailClients.copyAria", { label: t("settings.emailClients.username") })} />
					<Field label={t("settings.emailClients.passwordApiKey")} value={key} onCopy={copy} copied={copied} mono copyLabel={t("settings.copy")} copiedLabel={t("settings.copied")} copyAria={t("settings.emailClients.copyAria", { label: t("settings.emailClients.passwordApiKey") })} />
					<p className="text-xs text-neutral-500">
						{t("settings.emailClients.keyShownOnce")} <code>{server}/.well-known/jmap</code>.
					</p>
				</div>
			) : (
				<form onSubmit={submit} className="flex flex-wrap items-end gap-3">
					<div className="min-w-56 flex-1 space-y-2">
						<Label htmlFor="jmap-key-name">{t("settings.emailClients.deviceOrAppName")}</Label>
						<Input id="jmap-key-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Phone" />
					</div>
					<Button type="submit" disabled={busy}>
						<KeyRound className="h-4 w-4" />
						{busy ? t("settings.emailClients.creating") : t("settings.emailClients.createAppPassword")}
					</Button>
					{error && <p className="w-full text-sm text-red-600">{error}</p>}
				</form>
			)}
		</div>
	);
}

function Field({ label, value, onCopy, copied, mono, copyLabel, copiedLabel, copyAria }: { label: string; value: string; onCopy: (label: string, value: string) => void; copied: string | null; mono?: boolean; copyLabel: string; copiedLabel: string; copyAria: string }) {
	return (
		<div className="flex items-center gap-3">
			<span className="w-36 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
			<code className={`min-w-0 flex-1 truncate rounded-md bg-white px-2 py-1 text-sm ${mono ? "font-mono" : "font-sans"}`}>{value}</code>
			<Button type="button" variant="ghost" size="sm" onClick={() => onCopy(label, value)} aria-label={copyAria}>
				<Copy className="h-4 w-4" />
				{copied === label ? copiedLabel : copyLabel}
			</Button>
		</div>
	);
}
