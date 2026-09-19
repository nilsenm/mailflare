import { authFetch } from "@/lib/auth/client";
import type { OutboundMailSettings, OutboundMailTestResult, OutboundProvider } from "./types";

async function readJson<T>(response: Response): Promise<T> {
	const data = await response.json() as T & { error?: string };
	if (!response.ok) throw new Error(data.error ?? "");
	return data;
}

export async function fetchOutboundMailSettings(): Promise<OutboundMailSettings> {
	return readJson(await authFetch("/api/admin/outbound-mail"));
}

export async function saveOutboundMailSettings(input: { provider: OutboundProvider; fallback: boolean }) {
	return readJson<{ provider: OutboundProvider; fallback: boolean }>(await authFetch("/api/admin/outbound-mail", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	}));
}

export async function testOutboundMail(to: string): Promise<OutboundMailTestResult> {
	return readJson(await authFetch("/api/admin/outbound-mail/test", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ to }),
	}));
}
