import { authFetch } from "@/lib/auth/client";
import { getDictionary, LANG_COOKIE, resolveLang, translate, type TranslationKey } from "@/lib/i18n";
import type { InboxRule, InboxRuleInput, InboxRulesResponse, RuleFoldersResponse } from "./inbox-rules-types";

/** Client-side fallback error text, translated from the language cookie (no React context available here). */
function fallbackText(key: TranslationKey): string {
	if (typeof document === "undefined") return translate(getDictionary("es"), key);
	const cookieLang = document.cookie
		.split(";")
		.map((part) => part.trim().split("="))
		.find(([name]) => name === LANG_COOKIE)?.[1];
	return translate(getDictionary(resolveLang(cookieLang)), key);
}

export async function fetchInboxRules(mailboxId: string): Promise<InboxRulesResponse> {
	const params = new URLSearchParams({ mailboxId });
	const response = await authFetch(`/api/routing-rules?${params.toString()}`);
	return (await response.json()) as InboxRulesResponse;
}

export async function fetchRuleFolders(mailboxId: string): Promise<RuleFoldersResponse> {
	const params = new URLSearchParams({ mailboxId });
	const response = await authFetch(`/api/folders?${params.toString()}`);
	return (await response.json()) as RuleFoldersResponse;
}

export async function createInboxRule(input: InboxRuleInput) {
	const response = await authFetch("/api/routing-rules", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	const data = (await response.json()) as { error?: string };
	if (!response.ok) throw new Error(data.error ?? fallbackText("settings.inboxRules.createFailed"));
	return data;
}

export async function updateInboxRule(ruleId: string, input: InboxRuleInput) {
	const response = await authFetch(`/api/routing-rules/${ruleId}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	const data = (await response.json()) as { error?: string };
	if (!response.ok) throw new Error(data.error ?? fallbackText("settings.inboxRules.updateFailed"));
	return data;
}

export async function deleteInboxRule(ruleId: string) {
	const response = await authFetch(`/api/routing-rules/${ruleId}`, {
		method: "DELETE",
	});
	if (!response.ok) throw new Error(fallbackText("settings.inboxRules.deleteFailed"));
}

export function getRuleFieldLabel(field: string): string {
	const lang = typeof document === "undefined" ? "es" : resolveLang(
		document.cookie
			.split(";")
			.map((part) => part.trim().split("="))
			.find(([name]) => name === LANG_COOKIE)?.[1],
	);
	const dict = getDictionary(lang);
	if (field === "content") return translate(dict, "settings.inboxRules.fieldContent");
	if (field === "title") return translate(dict, "settings.inboxRules.fieldTitle");
	return translate(dict, "settings.inboxRules.fieldEmail");
}

export function getRuleOperatorLabel(operator: string): string {
	return operator === "exact" ? fallbackText("settings.inboxRules.operatorExactInline") : fallbackText("settings.inboxRules.operatorContainsInline");
}

export function getInboxRuleDestination(rule: Pick<InboxRule, "action" | "folderId">): string {
	if (rule.action === "spam" || rule.action === "trash") return rule.action;
	return rule.folderId ? `folder:${rule.folderId}` : "";
}
