// Assembles dist/ for GitHub Pages. Usage: npm run package
import { packageSite } from "./lib/site.mjs";

try {
  packageSite(process.cwd(), "dist");
  console.log("dist/ ready.");
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
