import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
	canMakeMailboxIndependent,
	evaluateIndependentConversion,
	independentAccountEmail,
	isOwnersPrimaryMailbox,
	mailboxOwnership,
	resolveIndependentAccountName,
	resolveNewAccountName,
} from "../src/lib/mailboxes/independent-utils.ts";
import {
	accountSecretPayload,
	apiErrorText,
	isValidOptionalEmail,
	validateAccountSecretFields,
} from "../src/components/accounts/account-fields-utils.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

const ADMIN = "admin@lesotur.com";
const primary = { localPart: "admin", hostname: "lesotur.com", type: "personal" };
const german = { localPart: "German", hostname: "Lesotur.com ", type: "personal" };
const shared = { localPart: "soporte", hostname: "lesotur.com", type: "shared" };

test("the account email is the mailbox address, trimmed and lowercased", () => {
	assert.equal(independentAccountEmail(german), "german@lesotur.com");
});

test("a mailbox is its owner's primary only when the address is the owner's login", () => {
	assert.equal(isOwnersPrimaryMailbox(primary, ADMIN), true);
	assert.equal(isOwnersPrimaryMailbox(primary, " ADMIN@lesotur.com "), true);
	assert.equal(isOwnersPrimaryMailbox(german, ADMIN), false);
	assert.equal(isOwnersPrimaryMailbox(german, null), false);
});

test("a personal secondary mailbox can get its own password", () => {
	assert.deepEqual(evaluateIndependentConversion(german, ADMIN), { ok: true, email: "german@lesotur.com" });
	assert.equal(canMakeMailboxIndependent(german, ADMIN), true);
});

test("missing, shared and primary mailboxes are refused with a reason", () => {
	assert.deepEqual(evaluateIndependentConversion(null, ADMIN), { ok: false, reason: "not_found" });
	assert.deepEqual(evaluateIndependentConversion(undefined, ADMIN), { ok: false, reason: "not_found" });
	assert.deepEqual(evaluateIndependentConversion(shared, ADMIN), { ok: false, reason: "not_personal" });
	assert.deepEqual(evaluateIndependentConversion(primary, ADMIN), { ok: false, reason: "already_primary" });
	assert.equal(canMakeMailboxIndependent(shared, ADMIN), false);
	assert.equal(canMakeMailboxIndependent(primary, ADMIN), false);
});

test("a mailbox without an explicit type is treated as personal", () => {
	assert.equal(canMakeMailboxIndependent({ localPart: "nilsen", hostname: "lesotur.com" }, ADMIN), true);
});

test("the list labels a mailbox independent only when it is its owner's login", () => {
	assert.equal(mailboxOwnership(primary, ADMIN), "independent");
	assert.equal(mailboxOwnership(german, ADMIN), "inside");
	assert.equal(mailboxOwnership(german, "german@lesotur.com"), "independent");
});

test("account names fall back from typed name to mailbox name to username", () => {
	assert.equal(resolveIndependentAccountName({ displayName: " Germán ", mailboxDisplayName: "G", localPart: "german" }), "Germán");
	assert.equal(resolveIndependentAccountName({ displayName: "  ", mailboxDisplayName: "Nilsen R.", localPart: "nilsen" }), "Nilsen R.");
	assert.equal(resolveIndependentAccountName({ displayName: undefined, mailboxDisplayName: null, localPart: "nilsen" }), "nilsen");
	assert.equal(resolveNewAccountName("Ventas", "ventas"), "Ventas");
	assert.equal(resolveNewAccountName(" ", "ventas"), "ventas");
	assert.equal(resolveNewAccountName(undefined, "ventas"), "ventas");
});

test("password and recovery email checks return the first translated problem", () => {
	const ok = { password: "12345678", confirmPassword: "12345678", resetEmail: "" };
	assert.equal(validateAccountSecretFields(ok), null);
	assert.equal(validateAccountSecretFields({ ...ok, password: "1234567", confirmPassword: "1234567" }), "admin.accountFields.passwordTooShort");
	assert.equal(validateAccountSecretFields({ ...ok, confirmPassword: "87654321" }), "admin.accountFields.passwordMismatch");
	assert.equal(validateAccountSecretFields({ ...ok, resetEmail: "no-es-correo" }), "admin.accountFields.resetEmailInvalid");
	assert.equal(validateAccountSecretFields({ ...ok, resetEmail: " persona@gmail.com " }), null);
	assert.equal(isValidOptionalEmail(""), true);
	assert.equal(isValidOptionalEmail("a@b"), false);
});

test("the request body leaves blank optional fields out", () => {
	assert.deepEqual(
		accountSecretPayload({ password: "secreto123", confirmPassword: "secreto123", resetEmail: " ", displayName: " " }),
		{ password: "secreto123" },
	);
	assert.deepEqual(
		accountSecretPayload({ password: "secreto123", confirmPassword: "secreto123", resetEmail: " r@gmail.com ", displayName: " Ana " }),
		{ password: "secreto123", displayName: "Ana", resetEmail: "r@gmail.com" },
	);
	assert.equal(apiErrorText("El correo ya está registrado", "x"), "El correo ya está registrado");
	assert.equal(apiErrorText({ fieldErrors: {} }, "fallback"), "fallback");
});

test("the conversion moves every per-mailbox table of the previous owner in one batch", () => {
	const source = read("src/app/api/mailboxes/[id]/independent/utils.ts");
	assert.match(source, /db\.batch\(\[/);
	for (const table of ["mailboxes", "folders", "routingRules", "calendarEvents", "messages"]) {
		assert.match(source, new RegExp(`\\.update\\(${table}\\)`), `${table} must follow the mailbox`);
	}
	assert.match(source, /\.delete\(mailboxAccess\)/);
	assert.match(source, /eq\(routingRules\.scope, "mailbox"\)/, "domain rules stay with the domain owner");
	assert.doesNotMatch(source, /\.update\(contacts\)/, "contacts are per account, not per mailbox");
});

test("the new-mailbox dialog creates an account instead of a mailbox inside another one", () => {
	const page = read("src/app/(admin)/mailboxes/page.tsx");
	assert.match(page, /authFetch\("\/api\/accounts", \{/);
	assert.doesNotMatch(page, /method: "POST"[^}]*\/api\/mailboxes"/);
	assert.doesNotMatch(page, /ownerUserId/);
	assert.doesNotMatch(page, /typeShared/);
});
