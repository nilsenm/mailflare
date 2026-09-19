import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getEmailAddress } from "@/lib/email/address";
import { selectOutboundProviders, sendWithOutboundProviders } from "./outbound-selection.js";

type Builder = {
	from: string | { name?: string; email: string };
	to: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	replyTo?: string | { name?: string; email: string };
	subject: string;
	headers?: Record<string, string>;
	text?: string;
	html?: string;
	attachments?: Array<{ filename: string; type: string; content: ArrayBuffer | ArrayBufferView | string; disposition?: string; contentId?: string }>;
};

export type OutboundProvider = "direct" | "relay";
export type OutboundSettings = { provider: OutboundProvider; fallback: boolean };
export type MailerConfig = {
	directUrl?: string;
	relayUrl?: string;
	loadSettings: () => Promise<OutboundSettings>;
};

function addressString(value: string | { name?: string; email: string }): string {
	if (typeof value === "string") return value;
	return value.name ? `"${value.name.replace(/"/g, '\\"')}" <${value.email}>` : value.email;
}

function messageIdFor(from: Builder["from"]): string {
	const domain = getEmailAddress(addressString(from)).split("@")[1] || "mailflare.local";
	return `<${crypto.randomUUID()}@${domain}>`;
}

export class Mailer {
	private readonly transporters = new Map<string, Transporter>();
	private settingsCache: { value: OutboundSettings; expiresAt: number } | null = null;

	constructor(private readonly config: MailerConfig) {}

	get configured() {
		return !!this.config.directUrl || !!this.config.relayUrl;
	}

	getAvailability() {
		return { direct: !!this.config.directUrl, relay: !!this.config.relayUrl };
	}

	getHosts() {
		return { directHost: hostFor(this.config.directUrl), relayHost: hostFor(this.config.relayUrl) };
	}

	invalidateSettingsCache() {
		this.settingsCache = null;
	}

	async getSettings(): Promise<OutboundSettings> {
		if (this.settingsCache && this.settingsCache.expiresAt > Date.now()) return this.settingsCache.value;
		const value = await this.config.loadSettings();
		this.settingsCache = { value, expiresAt: Date.now() + 10_000 };
		return value;
	}

	async send(message: Builder): Promise<{ messageId: string }> {
		const settings = await this.getSettings();
		return this.sendUsing(message, settings.provider, settings.fallback);
	}

	async sendUsing(message: Builder, provider: OutboundProvider, fallback = false): Promise<{ messageId: string }> {
		const available = this.getAvailability();
		const providers = selectOutboundProviders(provider, fallback, available) as OutboundProvider[];
		if (!available[provider] && providers.length > 0) console.warn(`[outbound-mail] ${provider} is not configured; using ${providers[0]}`);
		const messageId = message.headers?.["Message-ID"] ?? messageIdFor(message.from);
		const headers = { ...(message.headers ?? {}), "Message-ID": messageId };
		const sent = await sendWithOutboundProviders(providers, async (selected: OutboundProvider) => {
			console.info(`[outbound-mail] sending via ${selected}`);
			try {
				await this.transporter(selected).sendMail({
					from: addressString(message.from), to: message.to, cc: message.cc, bcc: message.bcc,
					replyTo: message.replyTo ? addressString(message.replyTo) : undefined,
					subject: message.subject, text: message.text, html: message.html,
					headers: Object.fromEntries(Object.entries(headers).filter(([key]) => key !== "Message-ID")),
					messageId,
					attachments: (message.attachments ?? []).map((attachment) => ({
						filename: attachment.filename, contentType: attachment.type, content: toBuffer(attachment.content),
						contentDisposition: attachment.disposition === "inline" ? "inline" : "attachment",
						cid: attachment.contentId ?? undefined,
					})),
				});
				return { messageId };
			} catch (error) {
				console.error(`[outbound-mail] ${selected} failed${providers.length > 1 ? "; fallback available" : ""}`, error);
				throw error;
			}
		});
		console.info(`[outbound-mail] sent via ${sent.provider}${sent.fallbackUsed ? " (fallback)" : ""}`);
		return sent.result;
	}

	async sendRaw(envelopeFrom: string, to: string, raw: Buffer): Promise<boolean> {
		const settings = await this.getSettings();
		const providers = selectOutboundProviders(settings.provider, settings.fallback, this.getAvailability()) as OutboundProvider[];
		if (!this.getAvailability()[settings.provider] && providers.length > 0) console.warn(`[outbound-mail] ${settings.provider} is not configured; using ${providers[0]} for raw message`);
		const sent = await sendWithOutboundProviders(providers, async (provider: OutboundProvider) => {
			console.info(`[outbound-mail] sending raw message via ${provider}`);
			try {
				await this.transporter(provider).sendMail({ envelope: { from: envelopeFrom, to }, raw });
				return true;
			} catch (error) {
				console.error(`[outbound-mail] raw message failed via ${provider}`, error);
				throw error;
			}
		});
		console.info(`[outbound-mail] raw message sent via ${sent.provider}${sent.fallbackUsed ? " (fallback)" : ""}`);
		return true;
	}

	private transporter(provider: OutboundProvider): Transporter {
		const url = provider === "direct" ? this.config.directUrl : this.config.relayUrl;
		if (!url) throw new Error(`${provider} outbound mail transport is not configured`);
		const cached = this.transporters.get(url);
		if (cached) return cached;
		const created = nodemailer.createTransport({ url, tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false" } });
		this.transporters.set(url, created);
		return created;
	}
}

function hostFor(url?: string): string | null {
	if (!url) return null;
	try { return new URL(url).hostname; } catch { return null; }
}

function toBuffer(content: ArrayBuffer | ArrayBufferView | string): Buffer {
	if (typeof content === "string") return Buffer.from(content);
	if (content instanceof ArrayBuffer) return Buffer.from(new Uint8Array(content));
	return Buffer.from(content.buffer, content.byteOffset, content.byteLength);
}

export function openMailer(config: MailerConfig): SendEmail & Mailer {
	return new Mailer(config) as unknown as SendEmail & Mailer;
}
