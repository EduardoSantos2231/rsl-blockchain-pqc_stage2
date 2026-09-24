import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { encryptPayload } from "../scripts/lib/crypto.mjs";

// src/ is kept out of git (original source); without it these tests are skipped.
const hasSource = existsSync(new URL("../src/lib.js", import.meta.url));
const lib = hasSource ? await import("../src/lib.js") : {};
const opts = { skip: !hasSource && "src/lib.js not present" };

const PASSWORD = "a-long-enough-test-password";

test(
  "decrypt: round trip with the envelope produced by the script",
  opts,
  async () => {
    const data = { approved: [{ title: "ç" }], rejected: [] };
    assert.deepEqual(
      await lib.decrypt(encryptPayload(data, PASSWORD, 1000), PASSWORD),
      data,
    );
  },
);

test("decrypt: rejects a wrong password", opts, async () => {
  const envelope = encryptPayload(
    { approved: [], rejected: [] },
    PASSWORD,
    1000,
  );
  await assert.rejects(lib.decrypt(envelope, "another-wrong-password"));
});

test("yearOf: extracts four digits, 0 when absent", opts, () => {
  assert.equal(lib.yearOf("2024-05"), 2024);
  assert.equal(lib.yearOf(undefined), 0);
});

test("snippet: drops the header line and collapses whitespace", opts, () => {
  assert.equal(
    lib.snippet("Por que descartar?\nSem   PQC.\n\nFim"),
    "Sem PQC. Fim",
  );
});

test("escapeHtml: escapes markup", opts, () => {
  assert.equal(
    lib.escapeHtml('<a href="x">&</a>'),
    "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;",
  );
});

test("matches: ignores case and accents, filters by confidence", opts, () => {
  const item = { title: "Criptografia Pós-Quântica", confidence: "high" };
  assert.ok(lib.matches(item, { query: "POS-quantica", confidence: "all" }));
  assert.ok(!lib.matches(item, { query: "", confidence: "low" }));
  assert.ok(lib.matches(item, { query: "", confidence: "high" }));
});

test("sortItems: confidence, then year, then title", opts, () => {
  const a = { title: "B", confidence: "low", year: "2020" };
  const b = { title: "A", confidence: "high", year: "2019" };
  const c = { title: "C", confidence: "high", year: "2023" };
  assert.deepEqual(
    lib.sortItems([a, b, c], "confidence").map((x) => x.title),
    ["C", "A", "B"],
  );
  assert.deepEqual(
    lib.sortItems([a, b, c], "title").map((x) => x.title),
    ["A", "B", "C"],
  );
});
