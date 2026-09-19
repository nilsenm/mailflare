import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { isNodeRuntime } from "@/lib/runtime";
import type { Mailer, OutboundProvider } from "../../../server/runtime/mailer";

export const APP_SETTINGS_ID = "default";

export async function getOutboundSettings(env: CloudflareEnv) {
	const [row] = await getDb(env)
		.select({ provider: appSettings.outboundProvider, fallback: appSettings.outboundFallback })
		.from(appSettings)
		.where(eq(appSettings.id, APP_SETTINGS_ID))
		.limit(1);
	return { provider: row?.provider ?? "direct", fallback: row?.fallback ?? true };
}

export async function updateOutboundSettings(env: CloudflareEnv, value: { provider: OutboundProvider; fallback: boolean }) {
	await getDb(env).insert(appSettings).values({ id: APP_SETTINGS_ID, outboundProvider: value.provider, outboundFallback: value.fallback })
		.onConflictDoUpdate({
			target: appSettings.id,
			set: { outboundProvider: value.provider, outboundFallback: value.fallback, updatedAt: new Date() },
		});
	getNodeMailer(env)?.invalidateSettingsCache();
	return value;
}

export function getNodeMailer(env: CloudflareEnv): Mailer | null {
	return isNodeRuntime(env) ? env.EMAIL as unknown as Mailer : null;
}
