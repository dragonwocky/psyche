import { createSearch, type SearchOptions } from "../../src/store";
import { FIELDS, indexUrl, type Page } from "./fixture";
import { describe, expect, test } from "./harness";

const until = async (condition: () => unknown, ms = 3000) => {
    const start = performance.now();
    while (!condition()) {
      if (performance.now() - start > ms) throw new Error("timed out waiting");
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  },
  // results' links, within the test page's origin
  links = (results: { href: string }[]) =>
    results.map(({ href }) => href.slice(location.origin.length)),
  // a store on psyche's worker and the fixture's index
  mount = (options: Partial<SearchOptions<Page>> = {}) => {
    const search = createSearch<Page>({
      index: indexUrl,
      fields: FIELDS,
      ...options,
    } as SearchOptions<Page>);
    return { search, dispose: () => search.close() };
  },
  // a page of the test's origin
  page = (path: string) => new URL(path, location.href).href;

describe("createSearch", () => {
  test("searches in a module worker, with the store's fields", async () => {
    const { search, dispose } = mount();
    search.input("kale");
    await until(() => search.getState().results.length);
    expect(links(search.getState().results)).toEqual([
      "/posts/kale?search=kale",
      "/media?entry=1&search=kale",
    ]);
    dispose();
    const body = mount({ fields: [{ key: "body", tier: 1 }] });
    body.search.input("cold months");
    await until(() => body.search.getState().results.length);
    expect(new URL(body.search.getState().results[0].href).pathname).toBe("/posts/kale");
    body.search.input("Growing");
    await until(() => !body.search.getState().loading);
    expect(body.search.getState().results.length).toBe(0);
    body.dispose();
  });

  test("groups results by a data key, and lists the sitemap as it opens", async () => {
    const { search, dispose } = mount({
      group: "section",
      sitemap: (result) => !result.value.entry,
    });
    search.open();
    await until(() => search.getState().results.length);
    expect(links(search.getState().results)).toEqual(["/", "/posts/kale", "/posts/garlic"]);
    expect(search.getState().groups.map(({ group }) => group)).toEqual(["Pages", "Posts"]);
    dispose();
  });

  test("links to the best match's value's link, or by the site's href", async () => {
    const { search, dispose } = mount();
    search.input("preparing soil");
    await until(() => search.getState().results.length);
    const url = new URL(search.getState().results[0].href);
    expect([url.pathname, url.searchParams.get("search"), url.hash]).toEqual([
      "/posts/kale",
      "preparing soil",
      "#soil",
    ]);
    dispose();
    const site = mount({ href: (link) => `${link}?site=1` });
    site.search.input("garlic");
    await until(() => site.search.getState().results.length);
    expect(new URL(site.search.getState().results[0].href).search).toBe("?site=1");
    site.dispose();
  });
});

describe("actions", () => {
  test("moves the selection within the results, and closes", async () => {
    const { search, dispose } = mount();
    search.open();
    await until(() => search.getState().results.length);
    search.selectNext();
    expect(search.getState().selected).toBe(1);
    search.selectPrevious();
    search.selectPrevious();
    expect(search.getState().selected).toBe(0);
    search.close();
    expect(search.getState().open).toBe(false);
    dispose();
  });

  test("visits the selected result: clears and closes, and returns its link", async () => {
    const { search, dispose } = mount();
    search.open();
    search.input("garlic");
    await until(() => search.getState().results.length);
    const url = new URL(search.visit()!);
    expect([url.pathname, url.searchParams.get("search")]).toEqual(["/posts/garlic", "garlic"]);
    expect([search.getState().open, search.getState().query]).toEqual([false, ""]);
    dispose();
  });

  test("loads a result within the page it's on again as it's visited", async () => {
    const { search, dispose } = mount();
    // landed on from a search for it, whose query is still in the search bar
    search.load(page("/posts/garlic?search=garlic"));
    await until(() => search.getState().page.located);
    search.open();
    await until(() => search.getState().results.length);
    await until(() => search.getState().results.length);
    const href = search.visit()!;
    expect(search.getState().page).toEqual({ href, query: "garlic" });
    dispose();
  });
});

describe("loading a page with ?search=", () => {
  test("has the page's query, then its match, and keeps the query to search again", async () => {
    const { search, dispose } = mount(),
      href = page("/?search=garden");
    search.load(href);
    expect(search.getState().page).toEqual({ href, query: "garden" });
    await until(() => search.getState().page.located);
    expect(search.getState().page.located?.href).toBe("/");
    expect(search.getState().query).toBe("garden");
    dispose();
  });

  test("has an empty page for a page without a query", () => {
    const { search, dispose } = mount(),
      href = page("/");
    expect(search.getState().page).toEqual({ query: "" });
    search.load(href);
    expect(search.getState().page).toEqual({ href, query: "" });
    dispose();
  });

  test("leaves a page's match unanswered once another page has loaded", async () => {
    const { search, dispose } = mount(),
      href = page("/?search=welcome");
    search.load(page("/?search=garden"));
    search.load(href);
    await until(() => search.getState().page.located);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect([search.getState().page.href, search.getState().page.query]).toEqual([href, "welcome"]);
    dispose();
  });
});
