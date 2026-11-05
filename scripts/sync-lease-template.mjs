// Copies ../server/lease_templates/lease.txt into lib/demo/lease-template.ts (used by demo mode).
// Run after editing the lease template:  npm run sync-template
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "../server/lease_templates/lease.txt");
const target = path.join(root, "lib/demo/lease-template.ts");
const text = fs.readFileSync(source, "utf8");
fs.writeFileSync(
  target,
  "// Copy of server/lease_templates/lease.txt, bundled for demo mode (no server).\n" +
    "// Keep it in sync with that file, or regenerate it (see README \"Demo mode\").\n" +
    `export const LEASE_TEMPLATE = ${JSON.stringify(text)};\n`,
);
console.log(`Updated ${path.relative(root, target)} from ${path.relative(root, source)}`);
