import { describe, expect, it } from "vitest";

import { createHandler, type IndexOptions, type Result } from "../src/handler";
import type { Fields, RecordMatch } from "../src/match";

type Page = {
  title: string;
  body: string;
  authors?: string[];
  headings?: { value: string; href: string }[];
  date?: string;
  entry?: number;
};
const FIELDS = [
  { key: "title", tier: 3 },
  { key: "headings", tier: 2.5 },
  { key: "authors", tier: 2 },
  { key: "body", tier: 1 },
] as const satisfies Fields;
const pages: (Page & { href: string })[] = [
  { href: "/", title: "Home", body: "Welcome to the garden" },
  {
    href: "/posts/kale",
    title: "Growing kale",
    body: "A long body ".repeat(50),
    authors: ["Alice"],
    headings: [{ value: "Preparing the soil", href: "#soil" }],
    date: "27 October 2026",
  },
  { href: "/media?entry=1", title: "Kale podcast", body: "", entry: 1 },
];
const records = pages.map(({ href, ...value }) => ({ href, value }));
const handler = async (options: Partial<IndexOptions> = {}, fields: Fields = FIELDS) => {
  const handle = createHandler<Page>();
  await handle({ type: "init", fields, options: { index: async () => records, ...options } });
  return handle;
};

describe("worker", () => {
  it("returns the best results, with excerpts in place of their fields", async () => {
    const results = (await (await handler())({ type: "search", query: "kale" })) as Result<Page>[];
    expect(results.map((result) => result.href)).toEqual(["/posts/kale", "/media?entry=1"]);
    expect(results[0].matches.body?.value.length).toBeLessThanOrEqual(192);
    expect("body" in results[0].value).toBe(false);
  });

  it("passes the record's other values through", async () => {
    const [result] = (await (
      await handler()
    )({
      type: "search",
      query: "growing",
    })) as Result<Page>[];
    expect(result.value).toEqual({ date: "27 October 2026" });
  });

  it("keeps its entry's link, and points to its best match's value", async () => {
    const [result] = (await (
      await handler()
    )({
      type: "search",
      query: "preparing soil",
    })) as Result<Page>[];
    expect(result.href).toBe("/posts/kale");
    expect(result.match).toEqual({ key: "headings", index: 0 });
    expect(result.matches.headings?.[0].href).toBe("#soil");
  });

  it("lists every entry for the sitemap", async () => {
    const all = (await (await handler())({ type: "sitemap" })) as Result<Page>[];
    expect(all.map((result) => result.href)).toEqual(["/", "/posts/kale", "/media?entry=1"]);
  });

  it("locates the entry at a url's path with the most of its params", async () => {
    const handle = await handler({
        index: async () => [
          { href: "/media", value: { title: "Media", body: "" } },
          { href: "/media?entry=1", value: { title: "Kale podcast", body: "" } },
          { href: "/media?entry=2", value: { title: "Garlic podcast", body: "" } },
          { href: "/posts/kale", value: { title: "Growing kale", body: "" } },
        ],
      }),
      locate = async (href: string) =>
        ((await handle({ type: "locate", query: "kale", href })) as RecordMatch<Page> | undefined)
          ?.value.title;
    expect(await locate("https://x.test/media?entry=1&search=kale")).toBe("Kale podcast");
    expect(await locate("https://x.test/media?search=kale")).toBe("Media");
    expect(await locate("https://x.test/media?entry=3")).toBe("Media");
    expect(await locate("https://x.test/posts/kale/")).toBe("Growing kale");
    expect(await locate("https://x.test/garden")).toBeUndefined();
  });

  it("points to its best match in a linked record", async () => {
    const handle = createHandler();
    await handle({
      type: "init",
      fields: [
        { key: "title", tier: 3 },
        { key: "authors", tier: 2 },
        { key: "name", tier: 0 },
      ],
      options: {
        index: async () => [
          {
            href: "/posts/kale/",
            value: {
              title: "Kale",
              authors: [{ value: { name: "Alice" }, href: "../../authors/alice" }],
            },
          },
        ],
      },
    });
    const [result] = (await handle({ type: "search", query: "alice" })) as Result[];
    expect(result.href).toBe("/posts/kale/");
    expect(result.match).toEqual({ key: "authors", index: 0 });
  });

  it("returns at most its limit of results", async () => {
    const handle = await handler({ limit: 1 });
    expect(((await handle({ type: "search", query: "kale" })) as unknown[]).length).toBe(1);
  });

  it("searches only the store's fields", async () => {
    const handle = await handler({}, [{ key: "body", tier: 1 }]);
    expect(await handle({ type: "search", query: "kale" })).toEqual([]);
  });

  it("searches nothing when the index fails to load, then retries", async () => {
    let calls = 0;
    const handle = await handler({
      index: async () => {
        if (!calls++) throw new Error("offline");
        return records;
      },
    });
    expect(await handle({ type: "search", query: "home" })).toEqual([]);
    expect(((await handle({ type: "search", query: "home" })) as unknown[]).length).toBe(1);
  });
});
