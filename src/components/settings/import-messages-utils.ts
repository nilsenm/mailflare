import { getAuthHeaders } from "@/lib/auth/client";
import { getDictionary, LANG_COOKIE, resolveLang, translate } from "@/lib/i18n";
import type { ImportMessagesResult, ImportProgressHandler } from "./import-messages-types";

/** Client-side fallback error text, translated from the language cookie (no React context available here). */
function currentDict() {
	if (typeof document === "undefined") return getDictionary("es");
	const cookieLang = document.cookie
		.split(";")
		.map((part) => part.trim().split("="))
		.find(([name]) => name === LANG_COOKIE)?.[1];
	return getDictionary(resolveLang(cookieLang));
}

export async function importMessageFiles(
	mailboxId: string,
	files: File[],
	destination: string,
	onProgress?: ImportProgressHandler,
): Promise<ImportMessagesResult> {
	const form = new FormData();
	form.set("mailboxId", mailboxId);
	form.set("destination", destination);
	for (const file of files) {
		form.append("files", file);
	}

	return new Promise((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.open("POST", "/api/import/messages");
		getAuthHeaders().forEach((value, key) => request.setRequestHeader(key, value));
		request.upload.onprogress = (event) => {
			if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 70));
		};
		request.onerror = () => reject(new Error(translate(currentDict(), "settings.importMessages.uploadFailed")));
		request.onload = () => {
			const data = JSON.parse(request.responseText || "{}") as ImportMessagesResult;
			if (request.status < 200 || request.status >= 300) {
				reject(new Error(data.error ?? translate(currentDict(), "settings.importMessages.failed")));
				return;
			}
			onProgress?.(100);
			resolve(data);
		};
		request.send(form);
	});
}

export function getImportSummary(result: ImportMessagesResult | null): string {
	if (!result) return "";
	return translate(currentDict(), "settings.import.resultSummary", { imported: result.imported ?? 0, skipped: result.skipped ?? 0 });
}
