import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { authenticateApiKey, requireScope } from "@/lib/api/auth";
import { sendEmailSchema } from "@/lib/validators";
import { sendEmail } from "@/lib/email/send";
import { decodeBase64Content } from "@/lib/email/attachments";
import { readJsonBody } from "@/lib/http/request";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { getSendErrorStatus } from "@/app/api/send/error-utils";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

export async function POST(request: Request) {
	const env = getEnv();
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	const auth = await authenticateApiKey(env, request.headers.get("authorization"));
	if (!auth || !requireScope(auth.scopes, "send")) {
		return NextResponse.json({ error: translate(dict, "server.unauthorized") }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await readJsonBody(request, 30 * 1024 * 1024);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: translate(dict, "server.invalidSendRequest") }, { status });
	}
	const parsed = sendEmailSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}

	try {
		const { attachments, ...fields } = parsed.data;
		const result = await sendEmail(env, {
			userId: auth.userId,
			...fields,
			attachments: attachments?.map((attachment) => ({
				filename: attachment.filename,
				type: attachment.type,
				content: decodeBase64Content(attachment.contentBase64),
				disposition: "attachment",
			})),
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
