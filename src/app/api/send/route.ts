import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireUser } from "@/lib/auth/cookies";
import { sendEmailSchema } from "@/lib/validators";
import { sendEmail } from "@/lib/email/send";
import { parseSendRequest } from "./utils";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { getSendErrorStatus } from "./error-utils";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loadMessageAttachmentContents } from "@/lib/email/attachments";
import { userOwnsDraft } from "@/app/api/drafts/utils";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function POST(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const user = await requireUser(env, request);
	let input;
	try {
		input = await parseSendRequest(request);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: translate(dict, "server.invalidSendRequest") }, { status });
	}
	const { attachments = [], draftId, ...fields } = input;
	const parsed = sendEmailSchema.omit({ attachments: true }).safeParse(fields);
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}

	// Files already stored on the draft (a forwarded message's attachments) ride
	// along with whatever the composer uploaded in this request.
	if (draftId) {
		const db = getDb(env);
		const [draft] = await db.select().from(messages).where(eq(messages.id, draftId)).limit(1);
		if (!userOwnsDraft(draft, user.id)) {
			return NextResponse.json({ error: translate(dict, "server.draftNotFound") }, { status: 404 });
		}
		attachments.push(...(await loadMessageAttachmentContents(env, draftId)));
	}

	try {
		const result = await sendEmail(env, {
			userId: user.id,
			...parsed.data,
			attachments,
		});
		return NextResponse.json(result);
	} catch (err) {
		const raw = err instanceof Error ? err.message : "Send failed";
		const status = getSendErrorStatus(raw);
		let message = raw;
		if (raw === "Mailbox is required") message = translate(dict, "server.mailboxRequired");
		else if (raw === "Mailbox not found") message = translate(dict, "server.mailboxNotFound");
		else if (raw === "Send failed") message = translate(dict, "server.sendFailed");
		return NextResponse.json({ error: message }, { status });
	}
}
