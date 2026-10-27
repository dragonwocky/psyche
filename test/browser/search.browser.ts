import { createRoot } from "solid-js";

import { closeSearch, createSearchClient, isSearchOpen } from "../../src/client";
import { createSearch, type PsycheMatchDetail } from "../../src/search";
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
  // createSearch in a root, with an input, until disposed
  mount = (options: Parameters<typeof createSearch>[1] = {}) =>
    createRoot((dispose) => {
      const search = createSearch(createSearchClient(workerUrl), options),
        $input = document.createElement("input");
      document.body.append($input);
      search.refs.input($input);
      return {
        search,
        $input,
        dispose: () => {
          closeSearch();
          dispose();
          $input.remove();
        },
      };
    });

describe("createSearch", () => {
  test("groups results by section in order of their best result", async () => {
    const { search, dispose } = mount();
    search.input("planting");
    await until(() => search.results().length);
    expect(search.groups().map((group) => group.section)).toEqual(["Posts"]);
    search.input("kale");
    await until(() => search.results().length === 2);
    expect(
      search.groups().map((group) => [group.section, group.results.map(({ index }) => index)]),
    ).toEqual([
      ["Posts", [0]],
      [undefined, [1]],
    ]);
    dispose();
  });

  test("lists the sitemap for an empty query as the panel opens", async () => {
    const { search, dispose } = mount();
    search.open();
    await until(() => search.results().length);
    expect(search.results().map((result) => result.href)).toEqual([
      "/",
      "/posts/kale",
      "/posts/garlic",
    ]);
    expect(search.groups().map((group) => group.section)).toEqual(["Pages", "Posts"]);
    dispose();
  });

  test("toggles with mod+k, focuses with /, moves with arrows and closes with escape", async () => {
    const { search, $input, dispose } = mount();
    press("k", { ctrlKey: true });
    expect(isSearchOpen()).toBe(true);
    await until(() => search.results().length);
    $input.blur();
    press("/");
    expect(document.activeElement).toBe($input);
    press("ArrowDown");
    expect(search.selected()).toBe(1);
    press("ArrowUp");
    press("ArrowUp");
    expect(search.selected()).toBe(0);
    press("Escape");
    expect(isSearchOpen()).toBe(false);
    press("k", { metaKey: true });
    press("k", { ctrlKey: true });
    expect(isSearchOpen()).toBe(false);
    dispose();
  });

  test("visits the selected result on enter, by the site's navigate", async () => {
    let visited = "";
    const { search, $input, dispose } = mount({ navigate: (href) => (visited = href) });
    search.open();
    search.input("garlic");
    await until(() => search.results().length);
    $input.focus();
    press("Enter");
    const url = new URL(visited);
    expect([url.pathname, url.searchParams.get("search"), isSearchOpen()]).toEqual([
      "/posts/garlic",
      "garlic",
      false,
    ]);
    dispose();
  });

  test("lists its shortcut for the legend", () => {
    const { search, dispose } = mount();
    expect(search.legend().label).toBe("to toggle search");
    expect(/^(⌘|CTRL) \+ K$/.test(search.legend().kbd)).toBe(true);
    dispose();
  });
});

describe("landing on a page with ?search=", () => {
  const land = async (query: string) => {
    const details: PsycheMatchDetail[] = [],
      listen = ({ detail }: CustomEvent<PsycheMatchDetail>) => details.push(detail);
    document.addEventListener("psyche:match", listen);
    history.replaceState(null, "", `/?search=${encodeURIComponent(query)}`);
    const $article = document.createElement("article");
    $article.innerHTML = "<h1>Home</h1><p>Welcome to the garden</p>";
    document.body.append($article);
    CSS.highlights.get("psyche")?.clear();
    const mounted = mount();
    return {
      ...mounted,
      details,
      done: () => {
        mounted.dispose();
        document.removeEventListener("psyche:match", listen);
        $article.remove();
        history.replaceState(null, "", "/");
      },
    };
  };

  test("announces the query, then its match, and highlights the page", async () => {
    const { search, details, done } = await land("garden");
    await until(() => details.length === 2);
    expect(details[0]).toEqual({ query: "garden" });
    expect([details[1].query, details[1].result?.res.href]).toEqual(["garden", "/"]);
    expect([...CSS.highlights.get("psyche")!].map(String)).toEqual(["garden"]);
    // the query stays in the search bar
    expect(search.query()).toBe("garden");
    done();
  });

  test("announces the latest match again when requested", async () => {
    const { details, done } = await land("welcome");
    await until(() => details.length === 2);
    document.dispatchEvent(new Event("psyche:request"));
    expect(details.length).toBe(3);
    expect(details[2].result?.res.href).toBe("/");
    done();
  });

  test("leaves the page to the site when its onLocate handles it", async () => {
    let located = "";
    const details: PsycheMatchDetail[] = [];
    const listen = ({ detail }: CustomEvent<PsycheMatchDetail>) => details.push(detail);
    document.addEventListener("psyche:match", listen);
    history.replaceState(null, "", "/?search=garden");
    const $article = document.createElement("article");
    $article.textContent = "Welcome to the garden";
    document.body.append($article);
    CSS.highlights.get("psyche")?.clear();
    const { dispose } = mount({ onLocate: ({ res }) => ((located = res.href), true) });
    await until(() => located);
    expect(CSS.highlights.get("psyche")?.size ?? 0).toBe(0);
    dispose();
    document.removeEventListener("psyche:match", listen);
    $article.remove();
    history.replaceState(null, "", "/");
  });
});
