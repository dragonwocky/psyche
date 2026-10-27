import { beforeAll, describe, expect, it } from "vitest";

import type { Fields } from "../src/match";
import { createSearch, type SearchState } from "../src/store";
import { createHandler, type Request, type Response } from "../src/worker";

type Page = { href: string; title: string; body: string; section?: string };
const FIELDS = [
  { key: "title", tier: 3 },
  { key: "body", tier: 1 },
] as const satisfies Fields;
const records: Page[] = [
  { href: "/", title: "Home", body: "Welcome to the garden", section: "Pages" },
  { href: "/posts/kale", title: "Growing kale", body: "Kale in winter", section: "Posts" },
  { href: "/posts/garlic", title: "Planting garlic", body: "Garlic and kale", section: "Posts" },
];

// the store without a worker or document: requests go straight to a handler
const store = (options: { group?: "section"; delay?: (request: Request) => number } = {}) => {
  const handle = createHandler<Page>({ index: async () => records }),
    ask = async <R extends Request>(request: R) => {
      await new Promise((resolve) => setTimeout(resolve, options.delay?.(request) ?? 0));
      return (await handle(request)) as Response<R, Page>;
    };
  return createSearch<Page>({ worker: "/unused.js", fields: FIELDS, group: options.group, ask });
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
  it("lists the sitemap as it opens", async () => {
    const search = store(),
      done = settled(search);
    search.open();
    const state = await done;
    expect(state.open).toBe(true);
    expect(state.results.map((result) => result.href)).toEqual([
      "/",
      "/posts/kale",
      "/posts/garlic",
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
      "/posts/kale",
      "/posts/garlic",
    ]);
    expect(states.at(-1)?.loading).toBe(false);
  });

  it("links results with the query, and to their best match's id", async () => {
    const search = store(),
      done = settled(search);
    search.input("kale");
    const [result] = (await done).results;
    expect(search.href(result)).toBe("https://x.test/posts/kale?search=kale");
    expect(search.href({ ...result, anchor: "soil" })).toBe(
      "https://x.test/posts/kale?search=kale#soil",
    );
  });

  it("lists its shortcut for a legend", () => {
    expect(store().legend()).toEqual({
      kbd: expect.stringMatching(/^(⌘|CTRL) \+ K$/),
      label: "to toggle search",
    });
  });
});
