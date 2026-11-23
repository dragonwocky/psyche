// times matching whole documents, in the build: pnpm bench
import { readFileSync } from "node:fs";

import { match } from "../dist/index.js";

const FIELDS = [
  { key: "title", tier: 3 },
  { key: "headings", tier: 2.5 },
  { key: "body", tier: 1 },
] as const;

// the repo's own markdown, as pages of a site: real prose, at a site's size
const files = [
    "README.md",
    "CHANGELOG.md",
    "examples/lume/index.md",
    "examples/lume/posts/garlic.md",
    "examples/lume/posts/kale.md",
  ].map((path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")),
  records = Array.from({ length: 100 }, (_, i) => {
    // distinct per page, so the memoised sanitise sees as many texts as a site's
    const body = `${files[i % files.length]}\n${i}`,
      headings = [...body.matchAll(/^#+ (.+)$/gm)].map(([, value], j) => ({
        href: `#h${j}`,
        value,
      }));
    return { href: `/pages/${i}`, title: headings[0]?.value ?? `page ${i}`, headings, body };
  });

// exact matches stop at their first hit; typos and multi-word queries scan every page
const queries = ["worker", "highlght", "search results", "teh serch", "a matched record", "zzqx"],
  search = (query: string) => match(query, records, { fields: FIELDS }),
  size = records.reduce((sum, { body }) => sum + body.length, 0);

for (const query of queries) search(query);
for (const query of queries) {
  const start = performance.now();
  for (let i = 0; i < 10; i++) search(query);
  console.log(
    `${query.padEnd(18)} ${((performance.now() - start) / 10).toFixed(2)} ms over ${records.length} pages (${(size / 1024).toFixed(0)}kB)`,
  );
}
