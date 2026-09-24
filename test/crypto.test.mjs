import { test } from "node:test";
import assert from "node:assert/strict";
import { pbkdf2Sync, createDecipheriv } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { encryptPayload } from "../scripts/lib/crypto.mjs";

const DATA = { approved: [{ oid: "1", title: "Título ç ã" }], rejected: [] };
const PASSWORD = "a-long-enough-test-password";
const ITERATIONS = 1000; // low on purpose, keeps the tests fast

// Independent decryption path (node:crypto) so the test does not reuse the code under test.
function decryptWithNode(envelope, password) {
  const ct = Buffer.from(envelope.ct, "base64");
  const key = pbkdf2Sync(
    password,
    Buffer.from(envelope.salt, "base64"),
    envelope.iter,
    32,
    "sha256",
  );
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAuthTag(ct.subarray(-16));
  const plain = Buffer.concat([
    decipher.update(ct.subarray(0, -16)),
    decipher.final(),
  ]);
  return JSON.parse(gunzipSync(plain).toString("utf8"));
}

test("envelope carries version, iterations, salt, iv and ciphertext", () => {
  const envelope = encryptPayload(DATA, PASSWORD, ITERATIONS);
  assert.equal(envelope.v, 1);
  assert.equal(envelope.iter, ITERATIONS);
  for (const key of ["salt", "iv", "ct"])
    assert.equal(typeof envelope[key], "string");
});

test("decrypts with the right password and returns the same data", () => {
  assert.deepEqual(
    decryptWithNode(encryptPayload(DATA, PASSWORD, ITERATIONS), PASSWORD),
    DATA,
  );
});

test("wrong password fails authentication", () => {
  assert.throws(() =>
    decryptWithNode(
      encryptPayload(DATA, PASSWORD, ITERATIONS),
      "another-wrong-password",
    ),
  );
});

test("every run uses a fresh salt and iv", () => {
  const a = encryptPayload(DATA, PASSWORD, ITERATIONS);
  const b = encryptPayload(DATA, PASSWORD, ITERATIONS);
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.ct, b.ct);
});

test("rejects passwords shorter than 16 characters", () => {
  assert.throws(() => encryptPayload(DATA, "short", ITERATIONS), /16/);
});

test("plaintext does not appear in the encrypted output", () => {
  const raw = JSON.stringify(encryptPayload(DATA, PASSWORD, ITERATIONS));
  assert.ok(!raw.includes("Título"));
});
