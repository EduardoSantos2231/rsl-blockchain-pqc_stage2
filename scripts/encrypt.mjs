// Encrypts raw/approved.json + raw/rejected.json into data/studies.enc.
// Usage: npm run encrypt   (prompts for the password; or set DATA_PASSWORD for automation)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createInterface } from "node:readline";
import { encryptPayload, DEFAULT_ITERATIONS } from "./lib/crypto.mjs";

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    rl._writeToOutput = (s) => {
      if (s.includes(question)) process.stdout.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const password = process.env.DATA_PASSWORD ?? (await askHidden("Password: "));
const data = {
  approved: JSON.parse(readFileSync("raw/approved.json", "utf8")),
  rejected: JSON.parse(readFileSync("raw/rejected.json", "utf8")),
};

let envelope;
try {
  envelope = encryptPayload(data, password);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
mkdirSync("data", { recursive: true });
writeFileSync("data/studies.enc", JSON.stringify(envelope));
console.log(
  `data/studies.enc written (PBKDF2, ${DEFAULT_ITERATIONS} iterations).`,
);
