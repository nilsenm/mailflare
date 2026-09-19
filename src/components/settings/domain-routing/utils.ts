import { authFetch } from "@/lib/auth/client";
import type { TranslationKey } from "@/lib/i18n";
import type {
	DomainRule,
	DomainRuleField,
	DomainRuleInput,
	DomainRuleMailbox,
	DomainRuleOperator,
} from "./types";

export const MATCH_FIELD_KEYS: Record<DomainRuleField, TranslationKey> = {
	recipient: "settings.domainRouting.matchFieldRecipient",
	sender: "settings.domainRouting.matchFieldSender",
	title: "settings.domainRouting.matchFieldSubject",
	content: "settings.domainRouting.matchFieldBody",
};

export const MATCH_OPERATOR_KEYS: Record<DomainRuleOperator, TranslationKey> = {
	contains: "settings.domainRouting.operatorContains",
	exact: "settings.domainRouting.operatorExact",
	starts_with: "settings.domainRouting.operatorStartsWith",
	ends_with: "settings.domainRouting.operatorEndsWith",
	regex: "settings.domainRouting.operatorRegex",
};

export const ACTION_KEYS: Record<DomainRule["action"], TranslationKey> = {
	store: "settings.domainRouting.actionStore",
	forward: "settings.domainRouting.actionForward",
	reject: "settings.domainRouting.actionReject",
};

async function readJson<T>(res: Response, t?: (key: TranslationKey) => string): Promise<T> {
	const json = (await res.json()) as T & { error?: unknown };
	if (!res.ok) {
		throw new Error(typeof json.error === "string" ? json.error : t ? t("settings.domainRouting.requestFailed") : "Request failed");
	}
	return json;
}

export async function fetchDomainRules(
	domainId: string,
	mailboxId?: string,
): Promise<{ rules: DomainRule[]; mailboxes: DomainRuleMailbox[] }> {
	const params = new URLSearchParams({ domainId });
	if (mailboxId) params.set("mailboxId", mailboxId);
	const res = await authFetch(`/api/routing-rules/domain?${params}`);
	const json = await readJson<{ rules: DomainRule[]; mailboxes: DomainRuleMailbox[] }>(res);
	return { rules: json.rules ?? [], mailboxes: json.mailboxes ?? [] };
}


function domainRuleUrl(id: string | null, mailboxId?: string): string {
	const params = new URLSearchParams();
	if (mailboxId) params.set("mailboxId", mailboxId);
	const queryString = params.toString();
	const query = queryString ? `?${queryString}` : "";
	return `/api/routing-rules/domain${id ? `/${id}` : ""}${query}`;
}

export async function createDomainRule(input: DomainRuleInput, t: (key: TranslationKey) => string, mailboxId?: string) {
	return readJson(
		await authFetch(domainRuleUrl(null, mailboxId), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		}),
		t,
	);
}

export async function updateDomainRule(id: string, input: DomainRuleInput, t: (key: TranslationKey) => string, mailboxId?: string) {
	return readJson(
		await authFetch(domainRuleUrl(id, mailboxId), {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		}),
		t,
	);
}

export async function deleteDomainRule(id: string, t: (key: TranslationKey) => string, mailboxId?: string) {
	return readJson(await authFetch(domainRuleUrl(id, mailboxId), { method: "DELETE" }), t);
}

export function describeRule(
	t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
	rule: DomainRule,
	mailboxes: DomainRuleMailbox[],
	hostname: string,
): string {
	const condition =
		rule.matchValue === "*"
			? t("settings.domainRouting.anyMessage")
			: `${t(MATCH_FIELD_KEYS[rule.matchField])} ${t(MATCH_OPERATOR_KEYS[rule.matchOperator])} "${rule.matchValue}"`;

	if (rule.action === "reject") return t("settings.domainRouting.describeReject", { condition });
	if (rule.action === "forward") {
		const copy = rule.keepCopy ? t("settings.domainRouting.describeForwardKeepCopy") : "";
		return t("settings.domainRouting.describeForward", { condition, target: rule.forwardTo ?? "—", copy });
	}
	const mailbox = mailboxes.find((m) => m.id === rule.mailboxId);
	const address = mailbox ? `${mailbox.localPart}@${hostname}` : "—";
	return t("settings.domainRouting.describeStore", { condition, address });
}

export function formatLastMatched(t: (key: TranslationKey) => string, value: DomainRule["lastMatchedAt"]): string {
	if (value === null || value === undefined) return t("settings.domainRouting.never");
	const numeric = typeof value === "number" ? value : Date.parse(String(value));
	if (!Number.isFinite(numeric)) return t("settings.domainRouting.never");
	// Drizzle timestamps serialise as seconds when they bypass the mapper.
	const ms = numeric < 1e12 ? numeric * 1000 : numeric;
	return new Date(ms).toLocaleString();
}

export function emptyRuleInput(domainId: string): DomainRuleInput {
	return {
		domainId,
		name: "",
		enabled: true,
		matchField: "recipient",
		matchOperator: "contains",
		matchValue: "",
		action: "store",
		mailboxId: null,
		forwardTo: "",
		keepCopy: false,
		rejectReason: "",
		priority: 100,
	};
}

export function ruleToInput(rule: DomainRule): DomainRuleInput {
	return {
		domainId: rule.domainId,
		name: rule.name ?? "",
		enabled: rule.enabled,
		matchField: rule.matchField,
		matchOperator: rule.matchOperator,
		matchValue: rule.matchValue,
		action: rule.action,
		mailboxId: rule.mailboxId,
		forwardTo: rule.forwardTo ?? "",
		keepCopy: rule.keepCopy,
		rejectReason: rule.rejectReason ?? "",
		priority: rule.priority,
	};
}
