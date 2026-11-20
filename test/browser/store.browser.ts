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
  press = (key: string, init: KeyboardEventInit = {}) =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
    ),
  live = () => [...(CSS.highlights.get("psyche") ?? [])].filter((r) => !r.collapsed).map(String),
  // results' links, within the test page's origin
  links = (results: { href: string }[]) =>
    results.map(({ href }) => href.slice(location.origin.length)),
  // a store on psyche's worker and the fixture's index, connected to the
  // document until disposed
  mount = (options: Partial<SearchOptions<Page>> = {}) => {
    const search = createSearch<Page>({
        index: indexUrl,
        fields: FIELDS,
        ...options,
      } as SearchOptions<Page>),
      disconnect = search.connect();
    return {
      search,
      dispose: () => {
        search.close();
        disconnect();
      },
    };
  };

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

describe("connect", () => {
  test("moves with arrows and closes with escape, once opened", async () => {
    const { search, dispose } = mount();
    press("k", { ctrlKey: true });
    expect(search.getState().open).toBe(false);
    search.open();
    await until(() => search.getState().results.length);
    press("ArrowDown");
    expect(search.getState().selected).toBe(1);
    press("ArrowUp");
    press("ArrowUp");
    expect(search.getState().selected).toBe(0);
    press("Escape");
    expect(search.getState().open).toBe(false);
    dispose();
  });

  test("visits the selected result by the site's navigate, and closes", async () => {
    let visited = "";
    const { search, dispose } = mount({ navigate: (href) => (visited = href) });
    search.open();
    search.input("garlic");
    await until(() => search.getState().results.length);
    search.visit();
    const url = new URL(visited);
    expect([url.pathname, url.searchParams.get("search"), search.getState().open]).toEqual([
      "/posts/garlic",
      "garlic",
      false,
    ]);
    dispose();
  });
});

describe("landing on a page with ?search=", () => {
  const land = (
    query: string,
    options: Partial<SearchOptions<Page>> = {},
    html = "<h1>Home</h1><p>Welcome to the garden</p>",
  ) => {
    history.replaceState(null, "", `/?search=${encodeURIComponent(query)}`);
    const $article = document.createElement("article");
    $article.innerHTML = html;
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
    expect(search.getState().page.located?.href).toBe("/");
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

  test("scrolls to its match's nearest element with a box", async () => {
    scrollTo(0, 0);
    const { done } = land(
      "garden",
      {},
      `<h1>Home</h1><div style="height: 300vh"></div>
      <p>Welcome to the <span style="display: contents">garden</span></p>`,
    );
    await until(() => live().length);
    const { top, bottom } = document.querySelector("article p")!.getBoundingClientRect();
    expect(top >= 0 && bottom <= innerHeight).toBe(true);
    done();
    scrollTo(0, 0);
  });

  test("leaves the page to the site when its onLoad handles it", async () => {
    let located = "";
    const { search, done } = land("garden", {
      onLoad: (page) => ((located = page.located?.href ?? ""), true),
    });
    await until(() => located);
    expect(search.getState().page.located?.href).toBe("/");
    expect(CSS.highlights.get("psyche")?.size ?? 0).toBe(0);
    done();
  });

  test("has an empty page for a page without a query", () => {
    const { search, dispose } = mount();
    expect(search.getState().page).toEqual({ query: "" });
    dispose();
  });

  test("handles the page again on its loadEvent, wherever it's dispatched", async () => {
    const { search, done } = land("garden", { loadEvent: "test:page-load" });
    await until(() => search.getState().page.located);
    history.replaceState(null, "", "/?search=welcome");
    document.dispatchEvent(new Event("test:page-load"));
    expect(search.getState().page.query).toBe("welcome");
    history.replaceState(null, "", "/?search=garden");
    window.dispatchEvent(new Event("test:page-load"));
    expect(search.getState().page.query).toBe("garden");
    done();
  });

  test("ignores the load events of the page's elements", () => {
    const { search, done } = land("garden");
    history.replaceState(null, "", "/?search=welcome");
    document.querySelector("article")!.dispatchEvent(new Event("load"));
    expect(search.getState().page.query).toBe("garden");
    done();
  });

  test("calls onLoad for a page without a query", () => {
    let page: unknown;
    const { dispose } = mount({ onLoad: (loaded) => void (page = loaded) });
    expect(page).toEqual({ query: "" });
    dispose();
  });
});
