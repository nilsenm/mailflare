import { clearClientSessionToken } from "@/lib/auth/client";
import { getDictionary, LANG_COOKIE, resolveLang, translate } from "@/lib/i18n";
import type {
	DomainSetupResult,
	MxCheckResult,
	RegisterResult,
	SetupPreparationResult,
	SetupStatus,
} from "./types";

export async function prepareSetup(): Promise<{ ok: boolean; data: SetupPreparationResult }> {
	const res = await fetch("/api/setup/prepare", { method: "POST" });
	return {
		ok: res.ok,
		data: (await res.json()) as SetupPreparationResult,
	};
}

function clientLangFallbackMessage(): string {
	const cookieLang = document.cookie
		.split(";")
		.map((part) => part.trim().split("="))
		.find(([name]) => name === LANG_COOKIE)?.[1];
	return translate(getDictionary(resolveLang(cookieLang)), "auth.register.setupStatusFailed");
}

export async function getSetupStatus(): Promise<SetupStatus> {
	const res = await fetch("/api/setup/status");
	const data = (await res.json()) as SetupStatus;
	if (!res.ok) throw new Error(data.error ?? clientLangFallbackMessage());
	return data;
}

export async function submitPrimaryDomain(hostname: string): Promise<{ ok: boolean; data: DomainSetupResult }> {
	const res = await fetch("/api/setup/domain", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ hostname }),
	});

	return {
		ok: res.ok,
		data: (await res.json()) as DomainSetupResult,
	};
}

export async function checkExistingMx(hostname: string): Promise<{ ok: boolean; data: MxCheckResult }> {
	const res = await fetch("/api/setup/domain/mx", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ hostname }),
	});

	return {
		ok: res.ok,
		data: (await res.json()) as MxCheckResult,
	};
}

export async function submitRegistration(
	form: FormData,
	payload: { firstRun: boolean; domain: string; enableSending?: boolean; replaceMxRecords?: boolean },
): Promise<{ ok: boolean; data: RegisterResult }> {
	const res = await fetch("/api/auth/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(
			payload.firstRun
				? {
						domain: payload.domain,
						enableSending: payload.enableSending,
						replaceMxRecords: payload.replaceMxRecords,
						username: form.get("username"),
						password: form.get("password"),
						resetEmail: form.get("resetEmail"),
						turnstileToken: form.get("turnstileToken"),
					}
				: {
						username: form.get("username"),
						password: form.get("password"),
						resetEmail: form.get("resetEmail"),
						turnstileToken: form.get("turnstileToken"),
					},
		),
	});

	const data = (await res.json()) as RegisterResult;
	if (res.ok) clearClientSessionToken();
	return { ok: res.ok, data };
}
