// SEO guard for the built homepage. Run after `npm run build`.
import { readFileSync } from "node:fs";

const EXPECTED = "Dylan Petzko - Everything Engineer - War Developer";
const CANONICAL = "https://petzko.sh/";
const FORBIDDEN = "emotionally unavailable";

const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const failures = [];

const meta = (attr, key) => {
  const tags = html.match(new RegExp(`<meta[^>]*\\b${attr}="${key}"[^>]*>`, "gi")) ?? [];
  if (tags.length !== 1) return { error: `expected one <meta ${attr}="${key}">, found ${tags.length}` };
  const m = tags[0].match(/\bcontent="([^"]*)"/i);
  return m ? { value: m[1] } : { error: `<meta ${attr}="${key}"> has no content` };
};

const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map((m) => m[1].trim());
const checks = {
  title: titles.length === 1 ? { value: titles[0] } : { error: `expected one <title>, found ${titles.length}` },
  "og:title": meta("property", "og:title"),
  "twitter:title": meta("name", "twitter:title"),
  description: meta("name", "description"),
  "og:description": meta("property", "og:description"),
  "twitter:description": meta("name", "twitter:description"),
};

for (const [name, r] of Object.entries(checks)) {
  if (r.error) { failures.push(`${name}: ${r.error}`); continue; }
  if (r.value !== EXPECTED) failures.push(`${name}: expected "${EXPECTED}", got "${r.value}"`);
  if (r.value.toLowerCase().includes(FORBIDDEN)) failures.push(`${name}: contains "Emotionally unavailable"`);
}

const h1s = html.match(/<h1[\s>]/gi) ?? [];
if (h1s.length !== 1) failures.push(`expected exactly one <h1>, found ${h1s.length}`);

const canon = [...html.matchAll(/<link[^>]*rel="canonical"[^>]*>/gi)].map((m) => (m[0].match(/href="([^"]*)"/) ?? [])[1]);
if (canon.length !== 1 || canon[0] !== CANONICAL) failures.push(`canonical: expected one "${CANONICAL}", got ${JSON.stringify(canon)}`);

if (failures.length) {
  console.error("SEO check failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("SEO check passed: 6 tags match, one <h1>, canonical unchanged.");
