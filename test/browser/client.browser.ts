import { createSearchClient } from "../../src/client";
import type { Ranking } from "../../src/match";
import workerUrl from "./fixture.worker?worker&url";
import { describe, expect, test } from "./harness";

describe("createSearchClient", () => {
  test("searches in a module worker", async () => {
    const client = createSearchClient(workerUrl),
      results = await client.ask({ type: "search", query: "kale" });
    expect(results.map((result) => result.href)).toEqual(["/posts/kale", "/media?entry=1"]);
  });

  test("answers concurrent requests by id", async () => {
    const client = createSearchClient(workerUrl),
      [garlic, home, sitemap] = await Promise.all([
        client.ask({ type: "search", query: "garlic" }),
        client.ask({ type: "search", query: "welcome" }),
        client.ask({ type: "sitemap" }),
      ]);
    expect(garlic[0].href).toBe("/posts/garlic");
    expect(home[0].href).toBe("/");
    expect(sitemap.length).toBe(3);
  });

  test("sends its ranking to the worker", async () => {
    const ranking = [{ key: "body", tier: 1, type: "text" }] as const satisfies Ranking,
      client = createSearchClient(workerUrl, { ranking });
    expect((await client.ask({ type: "search", query: "Growing" })).length).toBe(0);
    expect((await client.ask({ type: "search", query: "cold months" }))[0].href).toBe(
      "/posts/kale",
    );
  });

  test("links to results with the query, and to a matched heading's id", async () => {
    const client = createSearchClient(workerUrl),
      [result] = await client.ask({ type: "search", query: "preparing soil" });
    const url = new URL(client.href(result, "preparing soil"));
    expect([url.pathname, url.searchParams.get("search"), url.hash]).toEqual([
      "/posts/kale",
      "preparing soil",
      "#soil",
    ]);
  });

  test("links by the site's href", async () => {
    const client = createSearchClient(workerUrl, { href: (result) => `${result.href}?site=1` }),
      [result] = await client.ask({ type: "search", query: "garlic" });
    expect(new URL(client.href(result, "garlic")).search).toBe("?site=1");
  });
});
