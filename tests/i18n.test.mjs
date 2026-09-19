import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { DEFAULT_LANG, resolveLang, translate } from "../src/lib/i18n/i18n-utils.js";

function dictionaryKeys(file) {
	const source = readFileSync(new URL(file, import.meta.url), "utf8");
	return [...source.matchAll(/^\s*"([^"]+)":/gm)].map((match) => match[1]).sort();
}

const areas = readdirSync(new URL("../src/lib/i18n/en/", import.meta.url)).filter((name) => name.endsWith(".ts"));

test("every dictionary area exists in English and Spanish", () => {
	const spanish = readdirSync(new URL("../src/lib/i18n/es/", import.meta.url)).filter((name) => name.endsWith(".ts"));
	assert.deepEqual(spanish.sort(), [...areas].sort());
});

for (const area of areas) {
	test(`English and Spanish ${area} have exactly the same keys`, () => {
		assert.deepEqual(dictionaryKeys(`../src/lib/i18n/es/${area}`), dictionaryKeys(`../src/lib/i18n/en/${area}`));
	});
}

test("a key is defined in only one area", () => {
	const all = areas.flatMap((area) => dictionaryKeys(`../src/lib/i18n/en/${area}`));
	assert.deepEqual(all.filter((key, index) => all.indexOf(key) !== index), []);
});

test("translate interpolates variables", () => {
	assert.equal(translate({ greeting: "Hello, {name}!" }, "greeting", { name: "Ana" }), "Hello, Ana!");
});

test("translate selects simple one/other plurals", () => {
	const dictionary = { count: { one: "{count} mensaje", other: "{count} mensajes" } };
	assert.equal(translate(dictionary, "count", { count: 1 }), "1 mensaje");
	assert.equal(translate(dictionary, "count", { count: 3 }), "3 mensajes");
});

test("Spanish is the default and invalid cookie values fall back to it", () => {
	assert.equal(DEFAULT_LANG, "es");
	assert.equal(resolveLang(undefined), "es");
	assert.equal(resolveLang("fr"), "es");
	assert.equal(resolveLang("en"), "en");
});
