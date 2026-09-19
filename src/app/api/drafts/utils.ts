import { getAuthorizedSenderAddress } from "@/lib/email/sender";
import { translate, type Dictionary } from "@/lib/i18n";
import type { DraftPayload } from "./types";

export async function getDraftSender(
	env: CloudflareEnv,
	userId: string,
	input: DraftPayload,
	dict?: Dictionary,
): Promise<{ fromAddr: string; mailboxId: string } | { error: string }> {
	try {
		return await getAuthorizedSenderAddress(env, {
			userId,
			from: input.from ?? "",
			mailboxId: input.mailboxId,
		});
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Mailbox is not authorized";
		if (dict) {
			if (msg === "Mailbox is required") return { error: translate(dict, "server.mailboxRequired") };
			if (msg === "Mailbox not found") return { error: translate(dict, "server.mailboxNotFound") };
			if (msg === "Mailbox is not authorized") return { error: translate(dict, "server.mailboxNotAuthorized") };
		}
		return { error: msg };
	}
}

export function userOwnsDraft(draft: { userId: string; status: string } | undefined, userId: string): boolean {
	return !!draft && draft.userId === userId && draft.status === "draft";
}
