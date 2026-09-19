import { authFetch } from "@/lib/auth/client";
import { getDictionary, LANG_COOKIE, resolveLang, translate } from "@/lib/i18n";

export async function exportMailbox(mailboxId: string, filename: string): Promise<void> {
	const params = new URLSearchParams({ mailboxId });
	const response = await authFetch(`/api/export/messages?${params.toString()}`);
	if (!response.ok) {
		const data = (await response.json()) as { error?: string };
		const cookieLang = document.cookie
			.split(";")
			.map((part) => part.trim().split("="))
			.find(([name]) => name === LANG_COOKIE)?.[1];
		throw new Error(data.error ?? translate(getDictionary(resolveLang(cookieLang)), "settings.export.failed"));
	}

	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
