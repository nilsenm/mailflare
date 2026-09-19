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

// La API pública (/api/v1) la consumen integraciones con clave de API que esperan
// mensajes en inglés; solo cambia de idioma si la petición trae la cookie de idioma.
function isPublicApi(request: Request): boolean {
	try {
		return new URL(request.url).pathname.startsWith("/api/v1/");
	} catch {
		return false;
	}
}

export async function getServerLang(request?: Request): Promise<Lang> {
	if (request) {
		const cookie = requestCookie(request);
		if (!cookie && isPublicApi(request)) return "en";
		return resolveLang(cookie);
	}
	return resolveLang((await cookies()).get(LANG_COOKIE)?.value);
}
