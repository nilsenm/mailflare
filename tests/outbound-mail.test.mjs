import test from "node:test";
import assert from "node:assert/strict";
import { selectOutboundProviders, sendWithOutboundProviders } from "../server/runtime/outbound-selection.js";

test("selects the preferred outbound transport", () => {
	assert.deepEqual(selectOutboundProviders("relay", true, { direct: true, relay: true }), ["relay", "direct"]);
});

test("uses the fallback once when the preferred transport fails", async () => {
	const attempts = [];
	const sent = await sendWithOutboundProviders(["direct", "relay"], async (provider) => {
		attempts.push(provider);
		if (provider === "direct") throw new Error("direct failed");
		return "sent";
	});
	assert.deepEqual(attempts, ["direct", "relay"]);
	assert.equal(sent.provider, "relay");
	assert.equal(sent.fallbackUsed, true);
});

test("does not retry when fallback is disabled", async () => {
	const providers = selectOutboundProviders("direct", false, { direct: true, relay: true });
	let attempts = 0;
	await assert.rejects(sendWithOutboundProviders(providers, async () => {
		attempts += 1;
		throw new Error("failed");
	}), /failed/);
	assert.equal(attempts, 1);
});

test("uses the other transport when the selected one is not configured", () => {
	assert.deepEqual(selectOutboundProviders("relay", false, { direct: true, relay: false }), ["direct"]);
});

test("propagates the original error when both transports fail", async () => {
	const original = new Error("direct failed");
	await assert.rejects(sendWithOutboundProviders(["direct", "relay"], async (provider) => {
		throw provider === "direct" ? original : new Error("relay failed");
	}), (error) => error === original);
});
