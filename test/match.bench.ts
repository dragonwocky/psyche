// times matchFields over synthetic records: pnpm bench
import { matchFields } from "../src/match.ts";

const FIELDS = [
  { key: "title", tier: 3 },
  { key: "headings", tier: 2.5 },
  { key: "authors", tier: 2 },
  { key: "categories", tier: 2 },
  { key: "body", tier: 1 },
] as const;

// varied so the memoised sanitise sees many texts
const words =
    "garden kale garlic winter frost soil compost seedling harvest mulch bean leek onion".split(
      " ",
    ),
  pick = (n: number, seed: number) =>
    Array.from({ length: n }, (_, i) => words[(seed * 7 + i * 13) % words.length]).join(" ");
const records = Array.from({ length: 2000 }, (_, i) => ({
  href: `/posts/${i}`,
  title: `${pick(4, i)} ${i}`,
  body: Array.from({ length: 20 }, (_, j) => pick(12, i + j)).join("\n"),
  authors: [`Author ${i % 37}`],
  categories: [pick(1, i), pick(1, i + 3)],
  headings: [{ id: `h${i}`, value: pick(3, i + 5) }],
}));
const queries = ["kale", "garlc", "winter frost", "compost seedling harvest", "zzqx"],
  search = (query: string) => {
    for (const record of records) matchFields(query, record, FIELDS);
  };

for (const query of queries) search(query);
for (const query of queries) {
  const start = performance.now();
  for (let i = 0; i < 5; i++) search(query);
  console.log(
    `${query.padEnd(26)} ${((performance.now() - start) / 5).toFixed(2)} ms over ${records.length} records`,
  );
}
