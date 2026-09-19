import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { syncPersonalIdentity } from "@/lib/profile/sync";
import {
	ALLOWED_AVATAR_TYPES,
	MAX_AVATAR_SIZE,
	avatarKeyFor,
	isUploadedAvatarFile,
} from "./utils";

export async function GET(request: Request) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return new Response("No autorizado", { status: 401 });
	if (!user.avatarKey) return new Response("No encontrado", { status: 404 });

	const object = await env.BUCKET.get(user.avatarKey);
	if (!object) return new Response("No encontrado", { status: 404 });

	const headers = new Headers();
	headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set(
		"Content-Security-Policy",
		"default-src 'none'; img-src 'self'; sandbox",
	);
	headers.set("Cache-Control", "private, no-cache");
	return new Response(object.body, { headers });
}

export async function POST(request: Request) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return NextResponse.json({ error: "Se esperaban datos de formulario multipart" }, { status: 400 });
	}
	const file = form.get("file");
	if (!isUploadedAvatarFile(file)) {
		return NextResponse.json({ error: "Falta el archivo de imagen" }, { status: 400 });
	}
	if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
		return NextResponse.json({ error: "Usa una imagen JPEG, PNG, WebP o GIF" }, { status: 400 });
	}
	if (file.size > MAX_AVATAR_SIZE) {
		return NextResponse.json({ error: "La imagen debe pesar 2 MB o menos" }, { status: 413 });
	}

	const key = avatarKeyFor(user.id);
	await env.BUCKET.put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type },
	});
	await syncPersonalIdentity(getDb(env), {
		userId: user.id,
		name: user.name,
		avatarKey: key,
	});

	return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

	if (user.avatarKey) {
		await env.BUCKET.delete(user.avatarKey);
	}
	await syncPersonalIdentity(getDb(env), {
		userId: user.id,
		name: user.name,
		avatarKey: null,
	});
	return NextResponse.json({ ok: true });
}
