export type OutboundProvider = "direct" | "relay";

export type OutboundMailSettings = {
	provider: OutboundProvider;
	fallback: boolean;
	available: Record<OutboundProvider, boolean>;
	directHost: string | null;
	relayHost: string | null;
};

export type OutboundMailTestResult = { ok: true; messageId: string } | { ok: false; error: string };
