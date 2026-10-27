import { createSearch, type SearchOptions } from "../../src/store";
import { FIELDS, type Page } from "./fixture";
import workerUrl from "./fixture.worker?worker&url";
import { describe, expect, test } from "./harness";

const until = async (condition: () => unknown, ms = 3000) => {
    const start = performance.now();
    while (!condition()) {
      if (performance.now() - start > ms) throw new Error("timed out waiting");
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  },
  press = (key: string, init: KeyboardEventInit = {}) =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
    ),
  live = () => [...(CSS.highlights.get("psyche") ?? [])].filter((r) => !r.collapsed).map(String),
  // a store on the fixture's worker, with an input, connected to the document until disposed
  mount = (options: Partial<SearchOptions<Page>> = {}) => {
    const search = createSearch<Page>({ worker: workerUrl, fields: FIELDS, ...options }),
      $input = document.createElement("input");
    document.body.append($input);
    search.refs.input($input);
    const disconnect = search.connect();
    return {
      search,
      $input,
      dispose: () => {
        search.close();
        disconnect();
        $input.remove();
      },
    };
  };

describe("createSearch", () => {
  test("searches in a module worker, with the store's fields", async () => {
    const { search, dispose } = mount();
    search.input("kale");
    await until(() => search.getState().results.length);
    expect(search.getState().results.map((result) => result.href)).toEqual([
      "/posts/kale",
      "/media?entry=1",
    ]);
    dispose();
    const body = mount({ fields: [{ key: "body", tier: 1 }] });
    body.search.input("cold months");
    await until(() => body.search.getState().results.length);
    expect(body.search.getState().results[0].href).toBe("/posts/kale");
    body.search.input("Growing");
    await until(() => !body.search.getState().loading);
    expect(body.search.getState().results.length).toBe(0);
    body.dispose();
  });

  test("groups results by a data key, and lists the sitemap as it opens", async () => {
    const { search, dispose } = mount({ group: "section" });
    search.open();
    await until(() => search.getState().results.length);
    expect(search.getState().results.map((result) => result.href)).toEqual([
      "/",
      "/posts/kale",
      "/posts/garlic",
    ]);
    expect(search.getState().groups.map(({ group }) => group)).toEqual(["Pages", "Posts"]);
    dispose();
  });

  test("links to the best match's id, or by the site's href", async () => {
    const { search, dispose } = mount();
    search.input("preparing soil");
    await until(() => search.getState().results.length);
    const url = new URL(search.href(search.getState().results[0]));
    expect([url.pathname, url.searchParams.get("search"), url.hash]).toEqual([
      "/posts/kale",
      "preparing soil",
      "#soil",
    ]);
    dispose();
    const site = mount({ href: (result) => `${result.href}?site=1` });
    site.search.input("garlic");
    await until(() => site.search.getState().results.length);
    expect(new URL(site.search.href(site.search.getState().results[0])).search).toBe("?site=1");
    site.dispose();
  });
});

describe("connect", () => {
  test("toggles with mod+k, focuses with /, moves with arrows and closes with escape", async () => {
    const { search, $input, dispose } = mount();
    press("k", { ctrlKey: true });
    expect(search.getState().open).toBe(true);
    await until(() => search.getState().results.length);
    $input.blur();
    press("/");
    expect(document.activeElement).toBe($input);
    press("ArrowDown");
    expect(search.getState().selected).toBe(1);
    press("ArrowUp");
    press("ArrowUp");
    expect(search.getState().selected).toBe(0);
    press("Escape");
    expect(search.getState().open).toBe(false);
    press("k", { metaKey: true });
    press("k", { ctrlKey: true });
    expect(search.getState().open).toBe(false);
    dispose();
  });

  test("visits the selected result on enter, by the site's navigate", async () => {
    let visited = "";
    const { search, $input, dispose } = mount({ navigate: (href) => (visited = href) });
    search.open();
    search.input("garlic");
    await until(() => search.getState().results.length);
    $input.focus();
    press("Enter");
    const url = new URL(visited);
    expect([url.pathname, url.searchParams.get("search"), search.getState().open]).toEqual([
      "/posts/garlic",
      "garlic",
      false,
    ]);
    dispose();
  });

  test("highlights results in the elements given to refs, and again after a page load", async () => {
    const $result = document.createElement("a");
    $result.innerHTML = `<h3>Growing kale</h3><span>Alice</span><span>Gardening</span>`;
    document.body.append($result);
    const { search, dispose } = mount();
    try {
      // registered as a site renders its results
      search.subscribe(({ results }) => {
        if (!results.length) return;
        search.refs.result(0)($result);
        search.refs.field(0, "title")($result.children[0]);
        search.refs.field(0, "categories", 0)($result.children[2]);
      });
      search.input("growing");
      await until(() => live().includes("Growing"));
      search.input("gardening");
      await until(() => live().includes("Gardening"));
      // as astro moves a persisted island into the new page
      document.body.append($result);
      expect(live().includes("Gardening")).toBe(false);
      document.dispatchEvent(new Event("astro:page-load"));
      await until(() => live().includes("Gardening"));
    } finally {
      dispose();
      $result.remove();
    }
  });
});

describe("landing on a page with ?search=", () => {
  const land = (query: string, options: Partial<SearchOptions<Page>> = {}) => {
    history.replaceState(null, "", `/?search=${encodeURIComponent(query)}`);
    const $article = document.createElement("article");
    $article.innerHTML = "<h1>Home</h1><p>Welcome to the garden</p>";
    document.body.append($article);
    CSS.highlights.get("psyche")?.clear();
    const mounted = mount(options);
    return {
      ...mounted,
      done: () => {
        mounted.dispose();
        $article.remove();
        history.replaceState(null, "", "/");
      },
    };
  };

  test("has the page's query, then its match, and highlights the page", async () => {
    const { search, done } = land("garden");
    expect(search.getState().page).toEqual({ query: "garden" });
    await until(() => search.getState().page.located);
    expect(search.getState().page.located?.record.href).toBe("/");
    expect(live()).toEqual(["garden"]);
    // the query stays in the search bar
    expect(search.getState().query).toBe("garden");
    done();
  });

  test("highlights the page again when its matched text is re-rendered", async () => {
    const { done } = land("garden");
    await until(() => live().length);
    // as an island hydrating would, replacing the matched text's node
    const $p = document.querySelector("article p")!;
    $p.replaceChildren(document.createTextNode($p.textContent!));
    await until(() => live().length);
    expect(live()).toEqual(["garden"]);
    done();
  });

  test("leaves the page to the site when its onLocate handles it", async () => {
    let located = "";
    const { search, done } = land("garden", {
      onLocate: ({ record }) => ((located = record.href), true),
    });
    await until(() => located);
    expect(search.getState().page.located?.record.href).toBe("/");
    expect(CSS.highlights.get("psyche")?.size ?? 0).toBe(0);
    done();
  });

  test("has an empty page for a page without a query", () => {
    const { search, dispose } = mount();
    expect(search.getState().page).toEqual({ query: "" });
    dispose();
  });
});
