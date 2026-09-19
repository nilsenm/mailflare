import { NextResponse } from "next/server";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n";

async function accountsRemovedResponse(request: Request) {
	const lang = await getServerLang(request);
	const dict = getDictionary(lang);
	return NextResponse.json({ error: translate(dict, "server.multipleAccountsNotAvailable") }, { status: 410 });
}

export async function GET(request: Request) {
	return accountsRemovedResponse(request);
}

export async function POST(request: Request) {
	return accountsRemovedResponse(request);
}

export async function DELETE(request: Request) {
	return accountsRemovedResponse(request);
}
