import { describe, expect, it } from "vitest";

import { type Fields, match, matchFields, matchValues, rank } from "../src/match";

// a blog's fields, ranked title over tags over body
const FIELDS = [
  { key: "title", tier: 3 },
  { key: "headings", tier: 2.5 },
  { key: "authors", tier: 2 },
  { key: "categories", tier: 2 },
  { key: "body", tier: 1 },
] as const satisfies Fields;

const record = {
  href: "/posts/garden",
  title: "Planting a winter garden",
  body: "Garlic, broad beans and kale grow well through the cold months.\nMulch keeps the soil warm.",
  authors: ["Alice Nguyen"],
  categories: ["Gardening", "Seasons"],
};

describe("match", () => {
  it("finds exact, typo and out of order queries", () => {
    expect(match("winter", record.title)).toMatchObject({ match: "winter", score: 1 });
    expect(match("wntr", record.title).score).toBeGreaterThan(0);
    expect(match("zzz", record.title)).toEqual({ text: record.title, score: 0 });
  });

  it("excerpts long texts around the match", () => {
    const text = "word ".repeat(100) + "needle " + "word ".repeat(100),
      { text: excerpt, match: found } = match("needle", text);
    expect(found).toBe("needle");
    expect(excerpt.length).toBeLessThanOrEqual(192);
    expect(excerpt).toMatch(/^\.\.\..*needle.*\.\.\.$/);
  });

  it("normalises curly quotes and whitespace", () => {
    expect(match('"hello', "say “hello”\n\n\nworld").match).toBe('"hello');
  });
});

describe("matchFields", () => {
  it("scores by tier, keeping only the best value's match", () => {
    const title = matchFields("garden", record, FIELDS);
    expect(title.title?.match).toBe("garden");
    expect(title.categories?.[0].match).toBeUndefined();
    expect(title.score).toBe(1 + 3);
    expect(title.best).toEqual({ key: "title" });

    const tag = matchFields("nguyen", record, FIELDS);
    expect(tag.authors).toEqual([{ text: "Alice Nguyen", match: "Nguyen" }]);
    expect(tag.score).toBe(1 + 2);
    expect(tag.best).toEqual({ key: "authors", index: 0 });

    const body = matchFields("mulch", record, FIELDS);
    expect(body.body?.match).toBe("Mulch");
    expect(body.title?.match).toBeUndefined();
    expect(body.score).toBe(1 + 1);
  });

  it("scores 0 without a match, with every value still excerpted", () => {
    const none = matchFields("xylophone", record, FIELDS);
    expect(none.score).toBe(0);
    expect(none.best).toBeUndefined();
    expect(none.title).toEqual({ text: record.title });
  });

  it("matches values with ids, keeping their ids", () => {
    const fields = matchFields(
      "cold months",
      {
        ...record,
        body: "",
        headings: [
          { value: "When to plant", id: "planting" },
          { value: "The cold months", id: "cold" },
        ],
      },
      FIELDS,
    );
    expect(fields.score).toBe(1 + 2.5);
    expect(fields.best).toEqual({ key: "headings", index: 1 });
    expect(fields.headings).toEqual([
      { id: "planting", text: "When to plant", match: undefined },
      { id: "cold", text: "The cold months", match: "cold months" },
    ]);
    const single = matchFields("intro", { href: "/", lede: { value: "An intro", id: "lede" } }, [
      { key: "lede", tier: 1 },
    ]);
    expect(single.lede).toEqual({ text: "An intro", match: "intro", id: "lede" });
  });

  it("searches only the given fields, of any name and tier", () => {
    const fields = [
      { key: "summary", tier: 5 },
      { key: "title", tier: 0.5 },
    ] as const;
    const matched = matchFields("garden", { ...record, summary: "a garden bed" }, fields);
    expect(matched.summary?.match).toBe("garden");
    expect(matched.score).toBe(1 + 5);
    expect(matchFields("nguyen", record, fields).score).toBe(0);
    expect("authors" in matched).toBe(false);
  });

  it("leaves out missing fields and values that aren't text", () => {
    const matched = matchFields(
      "x",
      { href: "/", title: "", tags: ["a", 1, { id: "b" }] as unknown as string[] },
      [...FIELDS, { key: "tags", tier: 1 }],
    );
    expect("authors" in matched).toBe(false);
    expect(matched.title).toEqual({ text: "" });
    expect(matched.tags).toEqual([{ text: "a", match: undefined }]);
  });
});

describe("matchValues", () => {
  it("keeps every matching value's match, and ids", () => {
    expect(
      matchValues("gard", ["Gardening", "Seasons", { value: "Garden tools", id: "tools" }]),
    ).toEqual([
      { text: "Gardening", match: "Gard" },
      { text: "Seasons", match: undefined },
      { text: "Garden tools", match: "Gard", id: "tools" },
    ]);
  });
});

describe("rank", () => {
  const options: [string, string][] = [
    ["1", "Seasons"],
    ["2", "Gardening"],
    ["3", "Guardian"],
  ];
  it("returns every item for no query", () => {
    expect(rank("  ", options, ([, name]) => name)).toBe(options);
  });
  it("filters and sorts by score", () => {
    expect(rank("garden", options, ([, name]) => name).map(([id]) => id)).toEqual(["2"]);
    expect(rank("gard", options, ([, name]) => name).map(([id]) => id)).toEqual(["2", "3"]);
  });
});
