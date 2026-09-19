"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/client";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/i18n/client";

export function SpamFilterSettings() {
	const { t } = useT();
	const [enabled, setEnabled] = useState(true);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void authFetch("/api/settings/spam")
			.then(async (response) => {
				const data = await response.json() as { enabled?: boolean; error?: string };
				if (!response.ok) throw new Error(data.error ?? t("settings.spamFilter.loadFailed"));
				setEnabled(data.enabled !== false);
			})
			.catch((nextError) => setError(nextError instanceof Error ? nextError.message : t("settings.spamFilter.loadFailed")))
			.finally(() => setLoading(false));
	}, [t]);

	async function updateEnabled(nextEnabled: boolean) {
		const previous = enabled;
		setEnabled(nextEnabled);
		setLoading(true);
		setError(null);
		try {
			const response = await authFetch("/api/settings/spam", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ enabled: nextEnabled }),
			});
			const data = await response.json() as { enabled?: boolean; error?: string };
			if (!response.ok) throw new Error(data.error ?? t("settings.spamFilter.updateFailed"));
			setEnabled(data.enabled !== false);
		} catch (nextError) {
			setEnabled(previous);
			setError(nextError instanceof Error ? nextError.message : t("settings.spamFilter.updateFailed"));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<label className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
				<span className="flex-1">
					<span className="block text-sm font-medium text-neutral-900">{t("settings.spamFilter.title")}</span>
					<span className="mt-1 block text-sm text-neutral-500">{t("settings.spamFilter.description")}</span>
				</span>
				<Switch checked={enabled} disabled={loading} onCheckedChange={(value) => void updateEnabled(value)} aria-label={t("settings.spamFilter.enableAria")} />
			</label>
			{error && <p className="mt-2 px-4 text-sm text-red-600">{error}</p>}
		</div>
	);
}
