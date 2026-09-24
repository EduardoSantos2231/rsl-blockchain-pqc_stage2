import { pbkdf2Sync, randomBytes, createCipheriv } from "node:crypto";
import { gzipSync } from "node:zlib";

export const DEFAULT_ITERATIONS = 1_000_000;
export const MIN_PASSWORD_LENGTH = 16;

// Returns the envelope {v, iter, salt, iv, ct} (base64). ct ends with the GCM auth tag, as WebCrypto expects.
export function encryptPayload(
  data,
  password,
  iterations = DEFAULT_ITERATIONS,
) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    );
  }
  const payload = gzipSync(Buffer.from(JSON.stringify(data)));
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([
    cipher.update(payload),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return {
    v: 1,
    iter: iterations,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    ct: ct.toString("base64"),
  };
}
