import { describe, expect, it } from "vitest";

import type { Fields } from "../src/match";
import { createHandler, type Located, type Result } from "../src/worker";

type Page = {
  href: string;
  title: string;
  body: string;
  authors?: string[];
  headings?: { value: string; id: string }[];
  date?: string;
  entry?: number;
};
const FIELDS = [
  { key: "title", tier: 3 },
  { key: "headings", tier: 2.5 },
  { key: "authors", tier: 2 },
  { key: "body", tier: 1 },
] as const satisfies Fields;
const records: Page[] = [
  { href: "/", title: "Home", body: "Welcome to the garden" },
  {
    href: "/posts/kale",
    title: "Growing kale",
    body: "A long body ".repeat(50),
    authors: ["Alice"],
    headings: [{ value: "Preparing the soil", id: "soil" }],
    date: "27 October 2026",
  },
  { href: "/media?entry=1", title: "Kale podcast", body: "", entry: 1 },
];
const handler = async (options = {}, fields: Fields = FIELDS) => {
  const handle = createHandler<Page>({ index: async () => records, ...options });
  await handle({ type: "init", fields });
  return handle;
};

describe("worker", () => {
  it("returns the best results, with excerpts in place of their fields", async () => {
    const results = (await (await handler())({ type: "search", query: "kale" })) as Result<Page>[];
    expect(results.map((result) => result.href)).toEqual(["/posts/kale", "/media?entry=1"]);
    expect(results[0].match.body?.text.length).toBeLessThanOrEqual(192);
    expect("body" in results[0].data).toBe(false);
  });

  it("passes the record's other values through as data", async () => {
    const [result] = (await (
      await handler()
    )({
      type: "search",
      query: "growing",
    })) as Result<Page>[];
    expect(result.data).toEqual({ date: "27 October 2026" });
  });

  it("links to the best match's id", async () => {
    const [result] = (await (
      await handler()
    )({
      type: "search",
      query: "preparing soil",
    })) as Result<Page>[];
    expect(result.anchor).toBe("soil");
    expect(result.match.best).toEqual({ key: "headings", index: 0 });
  });

  it("lists every record for the sitemap, or the site's", async () => {
    const all = (await (await handler())({ type: "sitemap" })) as Result<Page>[],
      pages = (await (
        await handler({ sitemap: (record: Page) => !record.entry })
      )({ type: "sitemap" })) as Result<Page>[];
    expect(all.length).toBe(3);
    expect(pages.map((result) => result.href)).toEqual(["/", "/posts/kale"]);
  });

  it("locates by the site's hook, then by path", async () => {
    const locate = (all: Page[], _: string, url: URL) =>
        url.searchParams.has("entry") ? all.find((record) => record.entry) : undefined,
      handle = await handler({ locate });
    const entry = (await handle({
        type: "locate",
        query: "kale",
        href: "https://x.test/media?entry=1",
      })) as Located<Page>,
      page = (await handle({
        type: "locate",
        query: "kale",
        href: "https://x.test/posts/kale/",
      })) as Located<Page>;
    expect(entry.record.title).toBe("Kale podcast");
    expect(page.record.title).toBe("Growing kale");
    expect(page.match.title?.match).toBe("kale");
  });

  it("searches only the store's fields", async () => {
    const handle = await handler({}, [{ key: "body", tier: 1 }]);
    expect(await handle({ type: "search", query: "kale" })).toEqual([]);
  });

  it("searches nothing when the index fails to load, then retries", async () => {
    let calls = 0;
    const handle = createHandler({
      index: async () => {
        if (!calls++) throw new Error("offline");
        return records;
      },
    });
    await handle({ type: "init", fields: FIELDS });
    expect(await handle({ type: "search", query: "home" })).toEqual([]);
    expect(((await handle({ type: "search", query: "home" })) as unknown[]).length).toBe(1);
  });
});
