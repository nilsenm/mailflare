import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, resolveLang, type Lang } from ".";

function requestCookie(request: Request): string | undefined {
	const value = request.headers.get("cookie")
		?.split(";")
		.map((part) => part.trim().split("="))
		.find(([name]) => name === LANG_COOKIE)?.[1];
	return value ? decodeURIComponent(value) : undefined;
}

export async function getServerLang(request?: Request): Promise<Lang> {
	if (request) return resolveLang(requestCookie(request));
	return resolveLang((await cookies()).get(LANG_COOKIE)?.value);
}
