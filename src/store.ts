import { createHighlights, highlightLocated, highlightMatch } from "./highlight";
import { isShortcut, platformModifier } from "./keys";
import type { FieldsOf, PsycheRecord, ValueMatch } from "./match";
import type { Located, Request, Response, Result } from "./worker";

type Ask<T extends PsycheRecord> = <R extends Request>(request: R) => Promise<Response<R, T>>;

type SearchOptions<T extends PsycheRecord = PsycheRecord> = {
  // the site's search worker module, see createSearchWorker
  worker: string | URL;
  // the fields searched, and their tiers, sent to the worker
  fields: FieldsOf<T>;
  // loads the worker from the page's origin rather than the script's, e.g. when
  // scripts come from a dev server on another port that the page's server proxies
  origin?: boolean;
  // a result's link, default: its href with ?search= the query. results whose
  // best match has an id link to it, unless the link has a hash of its own
  href?: (result: Result<T>, query: string) => string;
  // a data key results are grouped by, in order of their best result
  group?: Exclude<keyof T, "href"> & string;
  // follows a result's link, e.g. astro's navigate for view transitions
  navigate?: (href: string, options: { sourceElement?: Element }) => void;
  // called as the search opens, e.g. to animate it or close other menus
  onOpen?: () => void;
  // called with the record a page's ?search= query matched, before it's
  // highlighted: return true to have the site highlight it instead (e.g. a
  // list entry rendered by the site's own components, from page in the state)
  onLocate?: (located: Located<T>) => boolean | void;
  // the page content to highlight a ?search= query's match in, default: article
  root?: string;
  // the ::highlight() name, default: psyche
  highlight?: string;
  // answers requests in place of the worker, e.g. createHandler in tests
  ask?: Ask<T>;
};

type ResultGroup<T extends PsycheRecord = PsycheRecord> = {
  group?: string;
  results: { result: Result<T>; index: number }[];
};

type SearchState<T extends PsycheRecord = PsycheRecord> = {
  open: boolean;
  query: string;
  // a search is waiting on the worker
  loading: boolean;
  // the best matches, or the sitemap for an empty query
  results: Result<T>[];
  groups: ResultGroup<T>[];
  selected: number;
  // the page's ?search= query, as the page loads, then the record it matched
  // once the index has loaded: the site's components highlight themselves by it
  page: { query: string; located?: Located<T> };
};

const withoutHash = (href: string) => href.replace(/#.*$/, ""),
  searchHref = (result: Result, query: string) => {
    const url = new URL(result.href, location.href);
    if (query) url.searchParams.set("search", query);
    return url.href;
  },
  groupsOf = <T extends PsycheRecord>(results: Result<T>[], group?: string) => {
    const groups = new Map<string | undefined, ResultGroup<T>>();
    results.forEach((result, index) => {
      const key = group
        ? ((result.data as Record<string, unknown>)[group] as string | undefined)
        : undefined;
      if (!groups.has(key)) groups.set(key, { group: key, results: [] });
      groups.get(key)!.results.push({ result, index });
    });
    return [...groups.values()];
  };

// the search's state and actions, without a framework or markup: a site renders
// from its state (getState, subscribe) and hands its elements to refs, which the
// search highlights its matches in. matching runs in the site's worker, started
// when first needed. connect() adds the search's keyboard shortcuts and page
// handling to the document
const createSearch = <T extends PsycheRecord = PsycheRecord>(options: SearchOptions<T>) => {
  const {
    fields,
    group,
    navigate = (href) => location.assign(href),
    onOpen,
    onLocate,
    root = "article",
    highlight = "psyche",
  } = options;

  // requests are answered by id, as they may be answered after newer ones
  let worker: Worker | undefined,
    requests = 0;
  const pending = new Map<number, (response: never) => void>(),
    workerUrl = () => {
      const url = new URL(options.worker, location.href);
      return options.origin ? new URL(url.pathname + url.search, location.origin) : url;
    },
    ask: Ask<T> = options.ask
      ? (() => {
          const ask = options.ask!,
            init = ask({ type: "init", fields });
          return (request) => init.then(() => ask(request));
        })()
      : (request) => {
          if (!worker) {
            worker = new Worker(workerUrl(), { type: "module" });
            worker.onmessage = ({ data }: MessageEvent<{ id: number; response: never }>) => {
              pending.get(data.id)?.(data.response);
              pending.delete(data.id);
            };
            worker.postMessage({ type: "init", fields, id: 0 });
          }
          const id = ++requests;
          worker.postMessage({ ...request, id });
          return new Promise((resolve) => pending.set(id, resolve));
        };

  let state: SearchState<T> = {
    open: false,
    query: "",
    loading: false,
    results: [],
    groups: [],
    selected: 0,
    page: { query: "" },
  };
  const listeners = new Set<(state: SearchState<T>) => void>(),
    set = (patch: Partial<SearchState<T>>) => {
      if (patch.results) {
        patch.groups = groupsOf(patch.results, group);
        $results.length = 0;
        $fields.clear();
      }
      state = { ...state, ...patch };
      for (const listener of listeners) listener(state);
      // after the site has rendered the results and registered their elements
      if (patch.results || patch.open) queueMicrotask(highlightResults);
    };

  // the site's elements, registered as it renders them
  let $input: HTMLInputElement | undefined;
  const $results: (Element | undefined)[] = [],
    $fields = new Map<string, Element | (Element | undefined)[]>(),
    refs = {
      input: (el: HTMLInputElement) => ($input = el),
      // a result's link, e.g. to scroll to as it's selected
      result: (i: number) => (el: Element) => ($results[i] = el),
      // the element a result's field is shown in, or an array field's item
      field: (i: number, key: string, item?: number) => (el: Element) => {
        const id = `${i}:${key}`;
        if (item === undefined) return $fields.set(id, el);
        const items = $fields.get(id);
        if (Array.isArray(items)) items[item] = el;
        else $fields.set(id, Object.assign([], { [item]: el }));
      },
    };

  // the results and the matched page are highlighted separately
  const highlightResults = () =>
      resultHighlights(
        state.results.flatMap((result, i) =>
          fields.flatMap((field) =>
            highlightMatch(
              $fields.get(`${i}:${field.key}`),
              (result.match as unknown as Record<string, ValueMatch>)[field.key],
            ),
          ),
        ),
      ),
    resultHighlights = createHighlights(highlight),
    pageHighlights = createHighlights(highlight),
    scrollToSelected = () => $results[state.selected]?.scrollIntoView({ block: "center" });

  const href = (result: Result<T>) => {
      const url = new URL((options.href ?? searchHref)(result, state.query), location.href);
      if (result.anchor && !url.hash) url.hash = result.anchor;
      return url.href;
    },
    // an empty query lists the sitemap
    search = async (query: string) => {
      set({ loading: true });
      const results = await ask(query ? { type: "search", query } : { type: "sitemap" });
      if (query !== state.query) return;
      set({
        loading: false,
        results,
        selected: Math.max(Math.min(state.selected, results.length - 1), 0),
      });
      scrollToSelected();
    },
    input = (query: string) => {
      set({ query });
      search(query);
    };

  const open = () => {
      if (state.open) return;
      set({ open: true });
      ask({ type: "load" });
      if (!state.query && !state.results.length) search("");
      onOpen?.();
      $input?.focus();
    },
    close = () => {
      if (!state.open) return;
      set({ open: false });
      $input?.blur();
    },
    toggle = () => (state.open ? close() : open()),
    select = (i: number) => set({ selected: Math.max(Math.min(i, state.results.length - 1), 0) }),
    selectPrevious = () => {
      $input?.focus();
      select(state.selected - 1);
      scrollToSelected();
    },
    selectNext = () => {
      $input?.focus();
      select(state.selected + 1);
      scrollToSelected();
    },
    visit = (i = state.selected) => {
      const result = state.results[i];
      if (!result) return;
      const url = href(result),
        $a = $results[i],
        here = withoutHash(url) === withoutHash(location.href);
      set({ query: "", results: [] });
      navigate(url, { sourceElement: $a });
      close();
      // a link within the page only scrolls, without a page load to search it again
      if (here) setTimeout(() => onPageLoad(true));
    };

  // the page, or a record linked to with a query param (e.g. a list entry)
  let loaded: string | undefined,
    // re-highlights the page when its matched text is re-rendered
    observer: MutationObserver | undefined;
  const searchPage = async ($page: Element, query: string) => {
      const located = await ask({ type: "locate", query, href: location.href });
      if (query !== new URL(location.href).searchParams.get("search")) return;
      set({ page: { query, located } });
      if (!located || onLocate?.(located) === true) return pageHighlights([]);
      let ranges = highlightLocated($page, located.match);
      pageHighlights(ranges);
      const range = ranges.find((range) => range);
      (
        range?.commonAncestorContainer.parentElement ?? range?.startContainer.parentElement
      )?.scrollIntoView();
      // components that hydrate after the page is highlighted (e.g. as they're
      // scrolled to) may replace the text a range is in, which collapses it
      observer = new MutationObserver(() => {
        if (!ranges.some((range) => range?.collapsed)) return;
        ranges = highlightLocated($page, located.match);
        pageHighlights(ranges);
      });
      observer.observe($page, { childList: true, subtree: true, characterData: true });
    },
    // astro's page-load fires on the first load and every navigation, other
    // sites only load, so each url is searched once unless forced
    onPageLoad = (force = false) => {
      if (!force && loaded === location.href) return;
      loaded = location.href;
      observer?.disconnect();
      const query = new URL(location.href).searchParams.get("search") ?? "",
        $page = document.querySelector(root);
      set({ page: { query } });
      if (query && $page) searchPage($page, query);
      else pageHighlights([]);
      // the query stays in the search bar, with its results, to search again
      if (query) input(query);
    };

  const connect = () => {
    const onKeydown = (event: KeyboardEvent) => {
        if (isShortcut(event, "k", { mod: true })) {
          event.preventDefault();
          toggle();
        }
        if (!state.open) return;
        if (isShortcut(event, "Escape")) close();
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
        // results kept across navigations (e.g. astro's transition:persist) are
        // moved into the new page, which collapses their ranges
        queueMicrotask(highlightResults);
        onPageLoad();
      };
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("astro:page-load", onLoad);
    if (document.readyState === "complete") onPageLoad();
    else addEventListener("load", onLoad, { once: true });
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("astro:page-load", onLoad);
      removeEventListener("load", onLoad);
      observer?.disconnect();
      resultHighlights([]);
      pageHighlights([]);
      loaded = undefined;
    };
  };

  return {
    getState: () => state,
    subscribe: (listener: (state: SearchState<T>) => void) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    open,
    close,
    toggle,
    input,
    select,
    selectPrevious,
    selectNext,
    visit,
    href,
    connect,
    refs,
    fields,
    // the shortcut that toggles the search, e.g. for a legend
    legend: () => ({ kbd: `${platformModifier()} + K`, label: "to toggle search" }),
  };
};

type SearchStore<T extends PsycheRecord = PsycheRecord> = ReturnType<typeof createSearch<T>>;

export { createSearch, type ResultGroup, type SearchOptions, type SearchState, type SearchStore };
