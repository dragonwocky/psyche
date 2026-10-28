import { describe, expect, it } from "vitest";

import { createHandler, type Result } from "../src/handler";
import type { Fields, Linked, RecordMatch } from "../src/match";

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
const handler = async (options = {}, fields: Fields = FIELDS) => {
  const handle = createHandler<Page>({ index: async () => records, ...options });
  await handle({ type: "init", fields });
  return handle;
};

describe("worker", () => {
  it("returns the best results, with excerpts in place of their fields", async () => {
    const results = (await (await handler())({ type: "search", query: "kale" })) as Result<Page>[];
    expect(results.map((result) => result.href)).toEqual(["/posts/kale", "/media?entry=1"]);
    expect(results[0].body?.text.length).toBeLessThanOrEqual(192);
    expect("body" in results[0].record).toBe(false);
  });

  it("passes the record's other values through", async () => {
    const [result] = (await (
      await handler()
    )({
      type: "search",
      query: "growing",
    })) as Result<Page>[];
    expect(result.record).toEqual({ date: "27 October 2026" });
  });

  it("keeps its entry's link, and points to its best match's value", async () => {
    const [result] = (await (
      await handler()
    )({
      type: "search",
      query: "preparing soil",
    })) as Result<Page>[];
    expect(result.href).toBe("/posts/kale");
    expect(result.best).toEqual({ key: "headings", index: 0 });
    expect(result.headings?.[0].href).toBe("#soil");
  });

  it("lists every record for the sitemap, or the site's", async () => {
    const all = (await (await handler())({ type: "sitemap" })) as Result<Page>[],
      pages = (await (
        await handler({ sitemap: ({ value }: Linked<Page>) => !value.entry })
      )({ type: "sitemap" })) as Result<Page>[];
    expect(all.length).toBe(3);
    expect(pages.map((result) => result.href)).toEqual(["/", "/posts/kale"]);
  });

  it("locates by the site's hook, then by path", async () => {
    const locate = (all: Linked<Page>[], _: string, url: URL) =>
        url.searchParams.has("entry") ? all.find(({ value }) => value.entry) : undefined,
      handle = await handler({ locate });
    const entry = (await handle({
        type: "locate",
        query: "kale",
        href: "https://x.test/media?entry=1",
      })) as RecordMatch<Page>,
      page = (await handle({
        type: "locate",
        query: "kale",
        href: "https://x.test/posts/kale/",
      })) as RecordMatch<Page>;
    expect(entry.record.title).toBe("Kale podcast");
    expect(page.record.title).toBe("Growing kale");
    expect(page.title?.match).toBe("kale");
  });

  it("points to its best match in a linked record", async () => {
    const handle = createHandler({
      index: async () => [
        {
          href: "/posts/kale/",
          value: {
            title: "Kale",
            authors: [{ value: { name: "Alice" }, href: "../../authors/alice" }],
          },
        },
      ],
    });
    await handle({
      type: "init",
      fields: [
        { key: "title", tier: 3 },
        { key: "authors", tier: 2 },
        { key: "name", tier: 0 },
      ],
    });
    const [result] = (await handle({ type: "search", query: "alice" })) as Result[];
    expect(result.href).toBe("/posts/kale/");
    expect(result.best).toEqual({ key: "authors", index: 0 });
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
