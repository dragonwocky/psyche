import { beforeAll, describe, expect, it, vi } from "vitest";

import type { Request } from "../src/handler";
import type { Fields } from "../src/match";
import { createSearch, type SearchOptions, type SearchState } from "../src/store";

type Page = { title: string; body: string; section?: string };
const FIELDS = [
  { key: "title", tier: 3 },
  { key: "body", tier: 1 },
] as const satisfies Fields;
const pages: (Page & { href: string })[] = [
  { href: "/", title: "Home", body: "Welcome to the garden", section: "Pages" },
  { href: "/posts/kale", title: "Growing kale", body: "Kale in winter", section: "Posts" },
  { href: "/posts/garlic", title: "Planting garlic", body: "Garlic and kale", section: "Posts" },
];

// the store without a worker or document: requests go to its handler on the
// page, which answers them after a delay set by the test
const latency = vi.hoisted(() => ({ delay: (_request: Request): number => 0 }));
vi.mock("../src/handler", async (original) => {
  const handler = await original<typeof import("../src/handler")>();
  return {
    ...handler,
    createHandler: (...args: Parameters<typeof handler.createHandler>) => {
      const handle = handler.createHandler(...args);
      return async (request: Request) => {
        await new Promise((resolve) => setTimeout(resolve, latency.delay(request)));
        return handle(request);
      };
    },
  };
});
const store = ({
  delay,
  ...options
}: Partial<SearchOptions<Page>> & { delay?: (request: Request) => number } = {}) => {
  latency.delay = delay ?? (() => 0);
  return createSearch<Page>({
    worker: false,
    index: async () => pages.map(({ href, ...value }) => ({ href, value })),
    fields: FIELDS,
    ...options,
  } as SearchOptions<Page>);
};
// the state once the next search has been answered
const settled = (search: ReturnType<typeof store>) =>
  new Promise<SearchState<Page>>((resolve) => {
    let loading = false;
    const unsubscribe = search.subscribe((state) => {
      if (state.loading) return void (loading = true);
      if (!loading) return;
      unsubscribe();
      resolve(state);
    });
  });

beforeAll(() => {
  Object.assign(globalThis, { location: new URL("https://x.test/") });
});

describe("createSearch", () => {
  it("lists only the site's results for its sitemap", async () => {
    const search = store({ sitemap: (result) => result.value.section === "Posts" }),
      done = settled(search);
    search.open();
    expect((await done).results.map((result) => result.href)).toEqual([
      "https://x.test/posts/kale",
      "https://x.test/posts/garlic",
    ]);
  });

  it("lists the sitemap as it opens", async () => {
    const search = store(),
      done = settled(search);
    search.open();
    const state = await done;
    expect(state.open).toBe(true);
    expect(state.results.map((result) => result.href)).toEqual([
      "https://x.test/",
      "https://x.test/posts/kale",
      "https://x.test/posts/garlic",
    ]);
    expect(state.groups).toHaveLength(1);
  });

  it("notifies subscribers of each change, until they unsubscribe", async () => {
    const search = store(),
      seen: string[] = [],
      unsubscribe = search.subscribe((state) => seen.push(state.query)),
      done = settled(search);
    search.input("kale");
    await done;
    unsubscribe();
    search.input("garlic");
    expect(seen[0]).toBe("kale");
    expect(seen.every((query) => query === "kale")).toBe(true);
  });

  it("groups results by a data key, in order of their best result", async () => {
    const search = store({ group: "section" }),
      done = settled(search);
    search.input("kale");
    const { groups } = await done;
    expect(groups.map(({ group }) => group)).toEqual(["Posts"]);
    expect(groups[0].results.map(({ index }) => index)).toEqual([0, 1]);
  });

  it("keeps the selection within the results", async () => {
    const search = store(),
      done = settled(search);
    search.input("kale");
    await done;
    search.selectNext();
    search.selectNext();
    search.selectNext();
    expect(search.getState().selected).toBe(1);
    search.select(-4);
    expect(search.getState().selected).toBe(0);
  });

  it("ignores responses to queries that have since changed", async () => {
    const search = store({
        delay: (request) => (request.type === "search" && request.query === "garlic" ? 30 : 0),
      }),
      states: SearchState<Page>[] = [];
    search.subscribe((state) => states.push(state));
    search.input("garlic");
    search.input("kale");
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(search.getState().query).toBe("kale");
    expect(search.getState().results.map((result) => result.href)).toEqual([
      "https://x.test/posts/kale?search=kale",
      "https://x.test/posts/garlic?search=kale",
    ]);
    expect(states.at(-1)?.loading).toBe(false);
  });

  it("links results with the query, or by the site's href, given the result", async () => {
    const search = store(),
      done = settled(search);
    search.input("garlic");
    expect((await done).results[0].href).toBe("https://x.test/posts/garlic?search=garlic");
    const site = store({
        href: (link, result, query) => `${link}?section=${result.value.section}&q=${query}`,
      }),
      linked = settled(site);
    site.input("garlic");
    expect((await linked).results[0].href).toBe(
      "https://x.test/posts/garlic?section=Posts&q=garlic",
    );
  });
});
