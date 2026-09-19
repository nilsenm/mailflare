"use client";

import { useCallback, useEffect, useState } from "react";
import { loadShortcutsEnabled, updateShortcutsEnabled } from "./use-shortcuts-enabled-utils";
import { useT } from "@/lib/i18n/client";

/** Loads and updates the signed-in account's keyboard shortcut preference. */
export function useShortcutsEnabled() {
	const { t } = useT();
	const [enabled, setEnabledState] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		loadShortcutsEnabled()
			.then((storedEnabled) => {
				if (!cancelled) setEnabledState(storedEnabled);
			})
			.catch((loadError) => {
				if (cancelled) return;
				setEnabledState(true);
				setError(t("mail.shortcuts.loadError"));
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [t]);

	const setEnabled = useCallback(async (next: boolean) => {
		const previous = enabled;
		setEnabledState(next);
		setError(null);
		try {
			setEnabledState(await updateShortcutsEnabled(next));
		} catch (updateError) {
			setEnabledState(previous);
			const message = t("mail.shortcuts.updateError");
			setError(message);
			throw new Error(message);
		}
	}, [enabled, t]);

	return { enabled, error, isLoading, setEnabled };
}
