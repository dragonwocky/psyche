import { describe, expect, it } from "vitest";

import { type Fields, match, rank } from "../src/match";

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

describe("match a value", () => {
  it("finds exact, typo and out of order queries", () => {
    expect(match("winter", record.title)).toMatchObject({ match: "winter", score: 1 });
    expect(match("wntr", record.title).score).toBeGreaterThan(0);
    expect(match("zzz", record.title)).toEqual({ value: record.title, score: 0 });
  });

  it("excerpts long texts around the match", () => {
    const text = "word ".repeat(100) + "needle " + "word ".repeat(100),
      { value: excerpt, match: found } = match("needle", text);
    expect(found).toBe("needle");
    expect(excerpt.length).toBeLessThanOrEqual(192);
    expect(excerpt).toMatch(/^\.\.\..*needle.*\.\.\.$/);
  });

  it("normalises curly quotes and whitespace", () => {
    expect(match('"hello', "say “hello”\n\n\nworld").match).toBe('"hello');
  });

  it("keeps a value's link", () => {
    expect(match("intro", { value: "An intro", href: "#lede" })).toEqual({
      value: "An intro",
      match: "intro",
      href: "#lede",
      score: 1,
    });
  });

  it("takes the excerpt's length and lead, and the threshold to match", () => {
    const text = "word ".repeat(100) + "needle " + "word ".repeat(100),
      { value: excerpt } = match("needle", text, { excerpt: 64, lead: 0.5 }),
      [before, after] = excerpt.split("needle");
    expect(excerpt.length).toBeLessThanOrEqual(64);
    expect(Math.abs(before.length - after.length)).toBeLessThanOrEqual(5);
    expect(match("wntr", record.title, { threshold: 0.9 }).score).toBe(0);
  });

  it("doesn't match a query's characters spread thinly, by default", () => {
    expect(match("gn", "Gardening").score).toBe(0);
    expect(match("gn", "Gardening", { threshold: 0.2 }).score).toBeGreaterThan(0);
  });
});

describe("match values", () => {
  it("matches each value, kept whole, with its score and link", () => {
    expect(
      match("gard", ["Gardening", "Seasons", { value: "Garden tools", href: "/tools" }]),
    ).toEqual([
      { value: "Gardening", match: "Gard", score: 1 },
      { value: "Seasons", score: 0 },
      { value: "Garden tools", match: "Gard", href: "/tools", score: 1 },
    ]);
  });
});

describe("match a record", () => {
  it("matches every field's values, and scores the best by its field's tier", () => {
    const matched = match("garden", record, { fields: FIELDS });
    expect(matched.value).toBe(record);
    expect(matched.matches.title?.match).toBe("garden");
    expect(matched.matches.categories?.[0]).toEqual({
      value: "Gardening",
      match: "Garden",
      score: 1,
    });
    expect(matched.score).toBe(1 + 3);
    expect(matched.match).toEqual({ key: "title" });

    const tag = match("nguyen", record, { fields: FIELDS });
    expect(tag.matches.authors).toEqual([{ value: "Alice Nguyen", match: "Nguyen", score: 1 }]);
    expect(tag.score).toBe(1 + 2);
    expect(tag.match).toEqual({ key: "authors", index: 0 });

    const body = match("mulch", record, { fields: FIELDS });
    expect(body.matches.body?.match).toBe("Mulch");
    expect(body.matches.title?.match).toBeUndefined();
    expect(body.score).toBe(1 + 1);
  });

  it("scores 0 without a match, with every value still excerpted", () => {
    const none = match("xylophone", record, { fields: FIELDS });
    expect(none.score).toBe(0);
    expect(none.match).toBeUndefined();
    expect(none.matches.title).toEqual({ value: record.title, score: 0 });
  });

  it("points to the best match's value, with its link", () => {
    const matched = match(
      "cold months",
      {
        ...record,
        body: "",
        headings: [
          { value: "When to plant", href: "#planting" },
          { value: "The cold months", href: "#cold" },
        ],
      },
      { fields: FIELDS },
    );
    expect(matched.score).toBe(1 + 2.5);
    expect(matched.match).toEqual({ key: "headings", index: 1 });
    expect(matched.matches.headings).toEqual([
      { href: "#planting", value: "When to plant", score: 0 },
      { href: "#cold", value: "The cold months", match: "cold months", score: 1 },
    ]);
  });

  it("searches only the given fields, of any name and tier", () => {
    const fields = [
      { key: "summary", tier: 5 },
      { key: "title", tier: 0.5 },
    ] as const;
    const matched = match("garden", { ...record, summary: "a garden bed" }, { fields });
    expect(matched.matches.summary?.match).toBe("garden");
    expect(matched.score).toBe(1 + 5);
    expect(match("nguyen", record, { fields }).score).toBe(0);
    expect("authors" in matched.matches).toBe(false);
  });

  it("leaves out missing fields and values that aren't text or records", () => {
    const matched = match(
      "x",
      { href: "/", title: "", tags: ["a", 1, null] as unknown as string[] },
      { fields: [...FIELDS, { key: "tags", tier: 1 }] },
    );
    expect("authors" in matched.matches).toBe(false);
    expect(matched.matches.title).toEqual({ value: "", score: 0 });
    expect(matched.matches.tags).toEqual([{ value: "a", score: 0 }]);
  });

  it("matches records in fields by the same fields, linked or not", () => {
    const fields = [...FIELDS, { key: "name", tier: 5 }],
      matched = match(
        "alice",
        {
          ...record,
          authors: [{ value: { name: "Alice Nguyen" }, href: "/authors/alice" }, { name: "Bob" }],
        },
        { fields },
      );
    expect(matched.matches.authors?.[0]).toMatchObject({
      value: { name: "Alice Nguyen" },
      matches: { name: { value: "Alice Nguyen", match: "Alice", score: 1 } },
      score: 1,
      href: "/authors/alice",
    });
    expect(matched.matches.authors?.[1]).toMatchObject({
      matches: { name: { value: "Bob" } },
      score: 0,
    });
    expect(matched.matches.authors?.[1]).not.toHaveProperty("href");
    expect(matched.score).toBe(1 + 2);
    expect(matched.match).toEqual({ key: "authors", index: 0 });
  });

  it("scores records in fields by their best value, without tiers", () => {
    const related = {
      ...record,
      title: "Kale",
      related: [{ value: { title: "Planting a winter garden" }, href: "/garden" }],
    };
    const fields = [...FIELDS, { key: "related", tier: 1 }],
      own = match("winter garden", record, { fields }),
      nested = match("winter garden", related, { fields });
    expect(nested.matches.related?.[0].score).toBe(1);
    expect(nested.score).toBe(1 + 1);
    expect(own.score).toBe(1 + 3);
  });

  it("matches a linked record, keeping its link", () => {
    const matched = match("kale", { value: record, href: "/kale" }, { fields: FIELDS });
    expect(matched.value).toBe(record);
    expect(matched.href).toBe("/kale");
    expect(matched.matches.body?.match).toBe("kale");
  });

  it("matches each of an array of records", () => {
    const other = { ...record, href: "/", title: "Kale" },
      matched = match("kale", [record, other], { fields: FIELDS });
    expect(matched.map(({ value }) => value.href)).toEqual(["/posts/garden", "/"]);
    expect(matched.map(({ score }) => score)).toEqual([1 + 1, 1 + 3]);
  });
});

describe("rank", () => {
  const values = ["Seasons", "Gardening", "Guardian", "Garden"];
  it("orders matches by score, without those that didn't match", () => {
    expect(rank(match("gard", values)).map(({ value }) => value)).toEqual([
      "Gardening",
      "Garden",
      "Guardian",
    ]);
    expect(rank(match("zzz", values))).toEqual([]);
  });

  it("keeps at most its limit", () => {
    expect(rank(match("garden", values), 1).map(({ value }) => value)).toEqual(["Gardening"]);
  });

  it("orders records by their best value's score", () => {
    const other = { ...record, href: "/", title: "Kale" };
    expect(
      rank(match("kale", [record, other], { fields: FIELDS })).map(({ value }) => value.href),
    ).toEqual(["/", "/posts/garden"]);
  });
});
