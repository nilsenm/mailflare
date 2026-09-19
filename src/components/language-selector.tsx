"use client";

import { useT } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
	const { lang, setLang, t } = useT();
	if (compact) return (
		<div className="flex items-center justify-center gap-1 text-xs" aria-label={t("common.language")}>
			{(["es", "en"] as Lang[]).map((value, index) => (
				<span key={value} className="flex items-center gap-1">
					{index > 0 && <span className="text-neutral-300">|</span>}
					<button type="button" onClick={() => setLang(value)} aria-pressed={lang === value}
						className={lang === value ? "font-semibold text-neutral-900" : "text-neutral-500 hover:text-neutral-900"}>
						{value.toUpperCase()}
					</button>
				</span>
			))}
		</div>
	);
	return (
		<select value={lang} onChange={(event) => setLang(event.target.value as Lang)}
			className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm" aria-label={t("common.language")}>
			<option value="es">{t("common.spanish")}</option>
			<option value="en">{t("common.english")}</option>
		</select>
	);
}
