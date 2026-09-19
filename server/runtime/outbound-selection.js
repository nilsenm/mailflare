/** @typedef {"direct" | "relay"} OutboundProvider */

export function selectOutboundProviders(preferred, fallback, available) {
	const alternate = preferred === "direct" ? "relay" : "direct";
	if (!available[preferred]) return available[alternate] ? [alternate] : [];
	if (fallback && available[alternate]) return [preferred, alternate];
	return [preferred];
}

export async function sendWithOutboundProviders(providers, attempt) {
	if (providers.length === 0) throw new Error("No outbound mail transport is configured");
	let originalError;
	for (let index = 0; index < providers.length; index += 1) {
		try {
			return { result: await attempt(providers[index]), provider: providers[index], fallbackUsed: index > 0 };
		} catch (error) {
			originalError ??= error;
		}
	}
	throw originalError;
}
