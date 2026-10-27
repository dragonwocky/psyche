import { describe, expect, it } from "vitest";

import type { PsycheRecord, Ranking } from "../src/match";
import { createHandler } from "../src/worker";

type Meta = { feed: number };
const records: PsycheRecord<Meta>[] = [
  { href: "/", title: "Home", body: "Welcome to the garden" },
  {
    href: "/posts/kale",
    title: "Growing kale",
    body: "A long body ".repeat(50),
    authors: ["Alice"],
    headings: [{ id: "soil", text: "Preparing the soil" }],
  },
  { href: "/media?entry=1", title: "Kale podcast", body: "", meta: { feed: 1 } },
];
const handler = (options = {}) => createHandler<Meta>({ index: async () => records, ...options });

describe("worker", () => {
  it("returns the best results without their bodies", async () => {
    const results = (await handler()({ type: "search", query: "kale" })) as {
      href: string;
      body?: string;
      match: { score: number };
    }[];
    expect(results.map((result) => result.href)).toEqual(["/posts/kale", "/media?entry=1"]);
    expect(results.every((result) => result.body === undefined)).toBe(true);
  });

  it("links to the best matching heading", async () => {
    const [result] = (await handler()({ type: "search", query: "preparing soil" })) as {
      heading?: { id: string };
    }[];
    expect(result.heading?.id).toBe("soil");
  });

  it("lists records without meta for the sitemap", async () => {
    const results = (await handler()({ type: "sitemap" })) as { href: string }[];
    expect(results.map((result) => result.href)).toEqual(["/", "/posts/kale"]);
  });

  it("locates by the site's hook, then by path", async () => {
    const locate = (all: PsycheRecord<Meta>[], _: string, url: URL) =>
        url.searchParams.has("entry") ? all.find((res) => res.meta) : undefined,
      handle = handler({ locate });
    const entry = (await handle({
        type: "locate",
        query: "kale",
        href: "https://x.test/media?entry=1",
      })) as {
        res: { title: string };
      },
      page = (await handle({
        type: "locate",
        query: "kale",
        href: "https://x.test/posts/kale/",
      })) as {
        res: { title: string };
        match: { title: { match?: string } };
      };
    expect(entry.res.title).toBe("Kale podcast");
    expect(page.res.title).toBe("Growing kale");
    expect(page.match.title.match).toBe("kale");
  });

  it("ranks by the client's ranking once initialised", async () => {
    const handle = handler(),
      ranking = [{ key: "body", tier: 1, type: "text" }] as const satisfies Ranking;
    await handle({ type: "init", ranking });
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
    expect(await handle({ type: "search", query: "home" })).toEqual([]);
    expect(((await handle({ type: "search", query: "home" })) as unknown[]).length).toBe(1);
  });
});
