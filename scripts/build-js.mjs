// Bundles src/main.js and writes the obfuscated assets/js/app.js. Usage: npm run build
import { build } from "esbuild";
import JavaScriptObfuscator from "javascript-obfuscator";
import { writeFileSync } from "node:fs";

const { outputFiles } = await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  format: "iife",
  minify: true,
  write: false,
  target: "es2022",
});

const code = JavaScriptObfuscator.obfuscate(outputFiles[0].text, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.6,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,
  stringArray: true,
  stringArrayEncoding: ["rc4"],
  stringArrayThreshold: 1,
  stringArrayWrappersCount: 2,
  identifierNamesGenerator: "hexadecimal",
  splitStrings: true,
  splitStringsChunkLength: 6,
  transformObjectKeys: true,
  simplify: true,
}).getObfuscatedCode();

writeFileSync("assets/js/app.js", code);
console.log(`assets/js/app.js written (${code.length} bytes).`);
