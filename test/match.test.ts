import { describe, expect, it } from "vitest";

import { match, matchFields, matchItems, rank, RANKING, type Ranking } from "../src/match";

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
  it("scores title over tags over body, keeping only the best field's match", () => {
    const title = matchFields("garden", record);
    expect(title.title.match).toBe("garden");
    expect(title.categories[0].match).toBeUndefined();
    expect(title.score).toBe(1 + 3);

    const tag = matchFields("nguyen", record);
    expect(tag.authors).toEqual([{ text: "Alice Nguyen", match: "Nguyen" }]);
    expect(tag.score).toBe(1 + 2);

    const body = matchFields("mulch", record);
    expect(body.body.match).toBe("Mulch");
    expect(body.title.match).toBeUndefined();
    expect(body.score).toBe(1 + 1);
  });

  it("scores 0 without a match, with every text field still excerpted", () => {
    const none = matchFields("xylophone", record);
    expect(none.score).toBe(0);
    expect(none.title).toEqual({ text: record.title });
  });

  it("matches headings between the title and tags", () => {
    const fields = matchFields("cold months", {
      ...record,
      body: "",
      headings: [
        { id: "planting", text: "When to plant" },
        { id: "cold", text: "The cold months" },
      ],
    });
    expect(fields.score).toBe(1 + 2.5);
    expect(fields.headings).toEqual([
      { id: "planting", text: "When to plant", match: undefined },
      { id: "cold", text: "The cold months", match: "cold months" },
    ]);
  });

  it("only searches fields in the ranking, with their tiers", () => {
    const ranking = [
      { key: "body", tier: 5, type: "text" },
      { key: "title", tier: 1, type: "text" },
    ] as const satisfies Ranking;
    const fields = matchFields("garden", { ...record, body: "a garden bed" }, ranking);
    expect(fields.body.match).toBe("garden");
    expect(fields.score).toBe(1 + 5);
    expect(matchFields("nguyen", record, ranking).score).toBe(0);
    expect("authors" in fields).toBe(false);
  });

  it("treats missing fields as empty", () => {
    expect(matchFields("x", { href: "/", title: "", body: "" }, RANKING).authors).toEqual([]);
  });
});

describe("matchItems", () => {
  it("keeps every matching item's match", () => {
    expect(matchItems("gard", ["Gardening", "Seasons", "Garden tools"])).toEqual([
      { text: "Gardening", match: "Gard" },
      { text: "Seasons", match: undefined },
      { text: "Garden tools", match: "Gard" },
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
