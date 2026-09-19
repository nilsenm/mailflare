import { en, type Dictionary, type TranslationKey } from "./en";
import { es } from "./es";
import * as utils from "./i18n-utils.js";

export { en, es };

export type Lang = "es" | "en";
export type { Dictionary, TranslationKey };

export const DEFAULT_LANG: Lang = utils.DEFAULT_LANG;
export const LANG_COOKIE = "mf_lang";

export function isLang(value: unknown): value is Lang {
	return value === "es" || value === "en";
}

export function resolveLang(value: unknown): Lang {
	return utils.resolveLang(value);
}

export function getDictionary(lang: Lang): Dictionary {
	return lang === "en" ? en : es;
}

export function translate(
	dictionary: Dictionary,
	key: TranslationKey,
	vars: Record<string, string | number> = {},
): string {
	return utils.translate(dictionary, key, vars);
}

export function dateLocale(lang: Lang): "es-PE" | "en-US" {
	return utils.dateLocale(lang);
}
