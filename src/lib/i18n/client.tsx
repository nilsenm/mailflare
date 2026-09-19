"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, translate, type Dictionary, type Lang, type TranslationKey } from ".";

type I18nContextValue = {
	lang: Lang;
	setLang: (lang: Lang) => void;
	t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, dictionary, lang }: {
	children: React.ReactNode;
	dictionary: Dictionary;
	lang: Lang;
}) {
	const router = useRouter();
	const setLang = useCallback((nextLang: Lang) => {
		document.cookie = `${LANG_COOKIE}=${nextLang}; Max-Age=31536000; Path=/; SameSite=Lax`;
		router.refresh();
	}, [router]);
	const value = useMemo(() => ({
		lang,
		setLang,
		t: (key: TranslationKey, vars?: Record<string, string | number>) => translate(dictionary, key, vars),
	}), [dictionary, lang, setLang]);
	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nContextValue {
	const context = useContext(I18nContext);
	if (!context) throw new Error("useT must be used inside I18nProvider");
	return context;
}
