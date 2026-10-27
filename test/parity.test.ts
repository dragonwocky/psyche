// compares v1 matching with snapshots of template-cms' built-in search, which
// are site content and so aren't committed: set PSYCHE_PARITY_DIR to a folder
// holding index.json, parity.json and parity-items.json to run these
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { matchFields, matchItems, MAX_RESULTS, rank } from "../src/match";

const dir = process.env.PSYCHE_PARITY_DIR,
  read = (file: string) => JSON.parse(readFileSync(join(dir!, file), "utf8"));

describe.skipIf(!dir)("parity with template-cms", () => {
  it("ranks and excerpts results identically", () => {
    const index = read("index.json"),
      { queries, results } = read("parity.json");
    for (const query of queries as string[]) {
      const actual = index
        .map((res: Record<string, unknown>) => ({ res, match: matchFields(query, res) }))
        .filter(({ match }: { match: { score: number } }) => match.score)
        .sort(
          (a: { match: { score: number } }, b: { match: { score: number } }) =>
            b.match.score - a.match.score,
        )
        .slice(0, MAX_RESULTS)
        .map(
          ({ res, match }: { res: { href: string }; match: ReturnType<typeof matchFields> }) => ({
            href: res.href,
            score: match.score,
            title: match.title.text,
            excerpt: match.body.text,
            matches: { title: match.title.match, excerpt: match.body.match },
            tags: [...match.authors, ...match.categories],
          }),
        );
      const expected = results[query].map(
        (r: {
          href: string;
          score: number;
          title: string;
          excerpt: string;
          matches: object;
          authors: { name: string; match?: string }[];
          categories: { name: string; match?: string }[];
        }) => ({
          href: r.href,
          score: r.score,
          title: r.title,
          excerpt: r.excerpt,
          matches: r.matches,
          tags: [...r.authors, ...r.categories].map(({ name, match }) => ({ text: name, match })),
        }),
      );
      expect(JSON.parse(JSON.stringify(actual)), query).toEqual(expected);
    }
  });

  it("matches tags and options identically", () => {
    const { names, options, queries, tags, options_ } = read("parity-items.json");
    for (const query of queries as string[]) {
      expect(
        matchItems(query, names).map(({ match }) => match ?? null),
        query,
      ).toEqual(tags[query].map((match: string | null) => match ?? null));
      expect(
        rank(query, options, ([, name]: [string, string]) => name),
        query,
      ).toEqual(options_[query]);
    }
  });
});
