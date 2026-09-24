import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";

const SITE_ENTRIES = ["index.html", "assets", "data"];
const STUDY_MARKER = '"criterion_id"';

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

// Lists files that would leak study data: any .json, or any file containing a study field.
export function findPlaintext(dir) {
  const offenders = [];
  for (const file of walk(dir)) {
    const leaks =
      file.endsWith(".json") ||
      readFileSync(file, "latin1").includes(STUDY_MARKER);
    if (leaks) offenders.push(relative(dir, file));
  }
  return offenders;
}

// Copies the publishable files from root into dist and refuses to continue if plaintext data slipped in.
export function packageSite(root, dist) {
  if (!existsSync(join(root, "data", "studies.enc"))) {
    throw new Error("data/studies.enc is missing: run the encrypt step first.");
  }
  rmSync(dist, { recursive: true, force: true });
  for (const entry of SITE_ENTRIES) {
    cpSync(join(root, entry), join(dist, entry), { recursive: true });
  }
  const offenders = findPlaintext(dist);
  if (offenders.length > 0) {
    rmSync(dist, { recursive: true, force: true });
    throw new Error(`Plaintext study data found: ${offenders.join(", ")}`);
  }
}
