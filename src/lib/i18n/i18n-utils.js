export const DEFAULT_LANG = "es";

export function resolveLang(value) {
	return value === "es" || value === "en" ? value : DEFAULT_LANG;
}

export function translate(dictionary, key, vars = {}) {
	const entry = dictionary[key];
	const template = typeof entry === "string"
		? entry
		: Number(vars.count) === 1 ? entry.one : entry.other;
	return template.replace(/\{(\w+)\}/g, (match, name) =>
		Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
	);
}

export function dateLocale(lang) {
	return lang === "es" ? "es-PE" : "en-US";
}
