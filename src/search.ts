import { createEffect, createMemo, createSignal, on, onCleanup, onMount } from "solid-js";

import { closeSearch, isSearchOpen, openSearch, type SearchClient, toggleSearch } from "./client";
import { createHighlights, highlightFields } from "./highlight";
import { isShortcut, platformModifier } from "./keys";
import type { Located, Result } from "./worker";

// a page's ?search= query, announced on document as psyche:match when the page
// loads, then again with the record it matched once the index has loaded. the
// site's own components (e.g. ones that hydrate later) highlight themselves by
// it, and dispatch psyche:request to have the latest match announced again
type PsycheMatchDetail<Meta = unknown> = { query: string; result?: Located<Meta> };

declare global {
  interface DocumentEventMap {
    "psyche:match": CustomEvent<PsycheMatchDetail>;
    "psyche:request": Event;
  }
}

type SearchOptions<Meta = unknown> = {
  // follows a result's link, e.g. astro's navigate for view transitions
  navigate?: (href: string, options: { sourceElement?: Element }) => void;
  // called as the panel opens, e.g. to animate it or close other menus
  onOpen?: () => void;
  // called with the record a page's ?search= query matched, before it's
  // highlighted: return true to have the site highlight it instead (e.g. a
  // feed entry rendered by the site's own components)
  onLocate?: (located: Located<Meta>) => boolean | void;
  // the page content to highlight a ?search= query's match in, default: article
  root?: string;
  // the ::highlight() name, default: psyche
  highlight?: string;
};

type ResultGroup<Meta = unknown> = {
  section?: string;
  results: { result: Result<Meta>; index: number }[];
};

const withoutHash = (href: string) => href.replace(/#.*$/, "");

// the search panel's state, without its markup, see <Search>. results are
// grouped by section, in order of their best result (or the index's order,
// for an empty query's sitemap), in one group without sections
const createSearch = <Meta = unknown>(
  client: SearchClient<Meta>,
  options: SearchOptions<Meta> = {},
) => {
  const {
    navigate = (href) => location.assign(href),
    onOpen,
    onLocate,
    root = "article",
    highlight = "psyche",
  } = options;
  let $input: HTMLInputElement | undefined,
    loaded: string | undefined,
    latest: PsycheMatchDetail<Meta> | undefined,
    // re-highlights the page when its matched text is re-rendered
    observer: MutationObserver | undefined;
  const $results: HTMLElement[] = [],
    // the panel's results and the matched page are highlighted separately
    highlightResults = createHighlights(highlight),
    highlightPage = createHighlights(highlight);

  const [query, setQuery] = createSignal(""),
    [results, setResults] = createSignal<Result<Meta>[]>([]),
    [selected, setSelected] = createSignal(0),
    groups = createMemo(() => {
      const groups = new Map<string | undefined, ResultGroup<Meta>>();
      results().forEach((result, index) => {
        if (!groups.has(result.section))
          groups.set(result.section, { section: result.section, results: [] });
        groups.get(result.section)!.results.push({ result, index });
      });
      return [...groups.values()];
    });

  const href = (result: Result<Meta>) => client.href(result, query()),
    scrollToSelected = () => $results[selected()]?.scrollIntoView({ block: "center" }),
    setResultHighlights = () =>
      highlightResults(
        results().flatMap((result, i) =>
          $results[i]
            ? highlightFields($results[i], result.match, { ranking: client.ranking })
            : [],
        ),
      ),
    announce = (detail: PsycheMatchDetail<Meta>) => {
      latest = detail;
      document.dispatchEvent(new CustomEvent("psyche:match", { detail }));
    },
    reannounce = () =>
      latest && document.dispatchEvent(new CustomEvent("psyche:match", { detail: latest }));

  // an empty query lists the sitemap
  const search = async (q: string) => {
      const matches = await client.ask(q ? { type: "search", query: q } : { type: "sitemap" });
      if (q !== query()) return;
      setResults(matches);
      setSelected((i) => Math.max(Math.min(i, matches.length - 1), 0));
      scrollToSelected();
    },
    input = (q: string) => {
      setQuery(q);
      search(q);
    };

  const selectPrevious = () => {
      $input?.focus();
      setSelected((i) => Math.max(i - 1, 0));
      scrollToSelected();
    },
    selectNext = () => {
      $input?.focus();
      setSelected((i) => Math.min(i + 1, results().length - 1));
      scrollToSelected();
    },
    visit = (result = results()[selected()], $a: Element | undefined = $results[selected()]) => {
      if (!result) return;
      const url = href(result),
        here = withoutHash(url) === withoutHash(location.href);
      setQuery("");
      setResults([]);
      navigate(url, { sourceElement: $a });
      closeSearch();
      // a link within the page only scrolls, without a page load to search it again
      if (here) setTimeout(() => onPageLoad(true));
    };

  // the page, or a record linked to with a query param (e.g. a feed entry)
  const searchPage = async ($page: HTMLElement, q: string) => {
    const located = await client.ask({ type: "locate", query: q, href: location.href });
    if (q !== new URL(location.href).searchParams.get("search")) return;
    announce({ query: q, result: located });
    if (!located || onLocate?.(located) === true) return highlightPage([]);
    const highlight = () => {
      const ranges = highlightFields($page, located.match, {
        ranking: client.ranking,
        fallback: true,
      });
      highlightPage(ranges);
      return ranges;
    };
    let ranges = highlight();
    const range = ranges.find((range) => range);
    (
      range?.commonAncestorContainer.parentElement ?? range?.startContainer.parentElement
    )?.scrollIntoView();
    // islands that hydrate after the page is highlighted (e.g. as they're
    // scrolled to) may replace the text a range is in, which collapses it
    observer = new MutationObserver(() => {
      if (ranges.some((range) => range?.collapsed)) ranges = highlight();
    });
    observer.observe($page, { childList: true, subtree: true, characterData: true });
  };

  // astro's page-load fires on the first load and every navigation, other
  // sites only load, so each url is searched once unless forced
  const onPageLoad = (force = false) => {
    if (!force && loaded === location.href) return;
    loaded = location.href;
    observer?.disconnect();
    const q = new URL(location.href).searchParams.get("search") ?? "",
      $page = document.querySelector<HTMLElement>(root);
    announce({ query: q });
    if (q && $page) searchPage($page, q);
    else highlightPage([]);
    // the query stays in the search bar, with its results, to search again
    if (q) input(q);
  };

  createEffect(on(results, () => queueMicrotask(setResultHighlights), { defer: true }));
  createEffect(
    on(
      isSearchOpen,
      (open) => {
        if (!open) return $input?.blur();
        client.ask({ type: "load" });
        if (!query() && !results().length) search("");
        onOpen?.();
        setResultHighlights();
        $input?.focus();
      },
      { defer: true },
    ),
  );

  onMount(() => {
    const onKeydown = (event: KeyboardEvent) => {
        if (isShortcut(event, "k", { mod: true })) {
          event.preventDefault();
          toggleSearch();
        }
        if (!isSearchOpen()) return;
        if (isShortcut(event, "Escape")) closeSearch();
        if (isShortcut(event, "ArrowUp")) {
          event.preventDefault();
          selectPrevious();
        }
        if (isShortcut(event, "ArrowDown")) {
          event.preventDefault();
          selectNext();
        }
        if (isShortcut(event, "Enter") && document.activeElement === $input) {
          event.preventDefault();
          visit();
        }
        if (isShortcut(event, "/") && document.activeElement !== $input) {
          event.preventDefault();
          $input?.focus();
        }
      },
      onLoad = () => {
        // a panel kept across navigations (e.g. astro's transition:persist) is
        // moved into the new page, which collapses its results' ranges
        queueMicrotask(setResultHighlights);
        onPageLoad();
      };
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("psyche:request", reannounce);
    document.addEventListener("astro:page-load", onLoad);
    if (document.readyState === "complete") onPageLoad();
    else addEventListener("load", onLoad, { once: true });
    onCleanup(() => {
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("psyche:request", reannounce);
      document.removeEventListener("astro:page-load", onLoad);
      removeEventListener("load", onLoad);
      observer?.disconnect();
      highlightResults([]);
      highlightPage([]);
    });
  });

  return {
    query,
    input,
    results,
    groups,
    selected,
    setSelected,
    isOpen: isSearchOpen,
    open: openSearch,
    close: closeSearch,
    toggle: toggleSearch,
    selectPrevious,
    selectNext,
    visit,
    href,
    refs: {
      input: (el: HTMLInputElement) => ($input = el),
      result: (i: number) => (el: HTMLElement) => ($results[i] = el),
    },
    // the shortcut listed in the panel's legend
    legend: () => ({ kbd: `${platformModifier()} + K`, label: "to toggle search" }),
  };
};

export { createSearch, type PsycheMatchDetail, type ResultGroup, type SearchOptions };
