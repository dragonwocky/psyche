import type { IndexOptions, Request, Response, Result } from "./handler";
import { highlight, rangesOf } from "./highlight";
import { linkOf } from "./href";
import { isShortcut } from "./keys";
import type { FieldsOf, Linked, MatchOptions } from "./match";
import type { RecordMatch } from "./matcher";

type Ask<T extends Record<string, unknown>> = <R extends Request>(
  request: R,
) => Promise<Response<R, T>>;

type SearchOptions<T extends Record<string, unknown> = Record<string, unknown>> = MatchOptions & {
  // the fields searched, and their tiers, sent to the worker
  fields: FieldsOf<T>;
  // the most results a search returns, default: 6
  limit?: number;
  // the results listed for an empty query, default: every entry's
  sitemap?: (result: Result<T>) => boolean;
  // a result's link, from its best match's link (its best value's, e.g. a
  // heading's #id, or its page's), default: that link with ?search= the query
  href?: (link: string, result: Result<T>, query: string) => string;
  // a data key results are grouped by, in order of their best result
  group?: keyof T & string;
  // follows a result's link, e.g. astro's navigate for view transitions
  navigate?: (href: string, options: { sourceElement?: Element }) => void;
  // called as the search opens, e.g. to animate it or close other menus
  onOpen?: () => void;
  // called as each page loads, with its ?search= query, and for a query, once
  // the index has loaded, the record it matched, before it's highlighted: return
  // true to have the site highlight it instead (e.g. a list entry rendered by the
  // site's own components). the same as page in the state
  onLoad?: (page: SearchState<T>["page"]) => boolean | void;
  // the page content to highlight a ?search= query's match in, default: article
  root?: string;
  // the event a page has loaded by, which its ?search= query is handled on, e.g.
  // a client router's after each navigation (astro's astro:page-load), on the
  // window or the document. default: load
  loadEvent?: string;
} & (
    | {
        // the index's url, relative to the page. its entries
        // are records linked to their pages, { href, value: record }
        index: string | URL;
        // psyche's worker, which a bundler finds by its url (e.g. vite's), or
        // its url, where a site serves it from psyche/worker
        worker?: string | URL;
        // loads the worker from the page's origin rather than the script's, e.g. when
        // scripts come from a dev server on another port that the page's server proxies
        origin?: boolean;
      }
    // matches on the page, without a worker, e.g. for a small index, which can
    // also be loaded by a function
    | { worker: false; index: string | URL | (() => Promise<Linked<T>[]>) }
  );

type ResultGroup<T extends Record<string, unknown> = Record<string, unknown>> = {
  group?: string;
  results: { result: Result<T>; index: number }[];
};

type SearchState<T extends Record<string, unknown> = Record<string, unknown>> = {
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
  page: { query: string; located?: RecordMatch<T> & { href: string } };
};

const withoutHash = (href: string) => href.replace(/#.*$/, ""),
  // the nearest element with a box around a node, to scroll to: an element
  // without one (e.g. display: contents) can't be scrolled into view
  boxOf = (node: Node | undefined) => {
    let $el = node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentElement;
    while ($el && !$el.getClientRects().length) $el = $el.parentElement;
    return $el;
  },
  searchHref = <R>(link: string, _result: R, query: string) => {
    const url = new URL(link, location.href);
    if (query) url.searchParams.set("search", query);
    return url.href;
  },
  groupsOf = <T extends Record<string, unknown>>(results: Result<T>[], group?: string) => {
    const groups = new Map<string | undefined, ResultGroup<T>>();
    results.forEach((result, index) => {
      const key = group
        ? ((result.value as Record<string, unknown>)[group] as string | undefined)
        : undefined;
      if (!groups.has(key)) groups.set(key, { group: key, results: [] });
      groups.get(key)!.results.push({ result, index });
    });
    return [...groups.values()];
  };

// psyche's worker, by a constant url so psyche's build leaves it be: its build
// then writes it literally, as ./worker.js, for a site's bundler to find, see
// vite.config.ts. a worker class of the site's choice (see origin) shadows
// Worker, as bundlers find workers by `new Worker(new URL(...))`
const WORKER_URL = "./worker.ts",
  startWorker = (Worker: typeof globalThis.Worker) =>
    new Worker(new URL(WORKER_URL, import.meta.url), { type: "module" }),
  // a worker from the page's origin, of the same path, see origin
  originWorker = () =>
    class extends Worker {
      constructor(url: string | URL, options?: WorkerOptions) {
        const { pathname, search } = new URL(url, location.href);
        super(new URL(pathname + search, location.origin), options);
      }
    };

// the search's state and actions, without a framework or markup: a site renders
// from its state (getState, subscribe) and hands its elements to refs, which the
// search highlights its matches in. matching runs in psyche's worker, started
// when first needed. connect() adds the open search's keyboard shortcuts and
// page handling to the document: opening it, e.g. by a shortcut, is the site's
const createSearch = <T extends Record<string, unknown> = Record<string, unknown>>(
  options: SearchOptions<T>,
) => {
  const {
    fields,
    group,
    navigate = (href) => location.assign(href),
    onOpen,
    onLoad,
    root = "article",
    loadEvent = "load",
  } = options;

  // the index and how it's matched, with its url resolved against the page
  const indexOptions = (): IndexOptions<T> => {
    const { index, limit, excerpt, lead, threshold } = options;
    return {
      index: typeof index === "function" ? index : new URL(index, location.href).href,
      limit,
      excerpt,
      lead,
      threshold,
    };
  };

  // requests are answered by id, as they may be answered after newer ones
  let worker: Worker | undefined,
    handler: Promise<(request: Request) => Promise<unknown>> | undefined,
    requests = 0;
  const pending = new Map<number, (response: never) => void>(),
    ask: Ask<T> = (request) => {
      // the matching is only loaded by a store without a worker, as it's bundled with it
      if (options.worker === false) {
        handler ??= import("./handler").then(async ({ createHandler }) => {
          const handle = createHandler<T>();
          await handle({ type: "init", fields, options: indexOptions() });
          return handle;
        });
        return handler.then((handle) => handle(request)) as never;
      }
      if (!worker) {
        const Worker = options.origin ? originWorker() : globalThis.Worker;
        worker = options.worker
          ? new Worker(new URL(options.worker, location.href), { type: "module" })
          : startWorker(Worker);
        worker.onmessage = ({ data }: MessageEvent<{ id: number; response: never }>) => {
          pending.get(data.id)?.(data.response);
          pending.delete(data.id);
        };
        worker.postMessage({ type: "init", fields, options: indexOptions(), id: 0 });
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

  // the results and the matched page are highlighted separately, each
  // replacing only its own ranges
  const replacing = () => {
      let remove = () => {};
      return (ranges: Range[]) => {
        remove();
        remove = highlight(ranges);
      };
    },
    resultHighlights = replacing(),
    pageHighlights = replacing(),
    highlightResults = () =>
      resultHighlights(
        state.results.flatMap((result, i) =>
          rangesOf(
            Object.fromEntries(fields.map(({ key }) => [key, $fields.get(`${i}:${key}`)])),
            result,
          ),
        ),
      ),
    scrollToSelected = () => $results[state.selected]?.scrollIntoView({ block: "center" });

  const href = (result: Result<T>) => {
      return new URL(
        (options.href ?? searchHref)(linkOf(result), result, state.query),
        location.href,
      ).href;
    },
    // an empty query lists the sitemap
    search = async (query: string) => {
      set({ loading: true });
      let results = await ask(query ? { type: "search", query } : { type: "sitemap" });
      if (query !== state.query) return;
      if (!query && options.sitemap) results = results.filter(options.sitemap);
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
      if (onLoad?.({ query, located }) === true || !located) return pageHighlights([]);
      let ranges = rangesOf($page, located);
      pageHighlights(ranges);
      boxOf(ranges[0]?.commonAncestorContainer)?.scrollIntoView();
      // components that hydrate after the page is highlighted (e.g. as they're
      // scrolled to) may replace the text a range is in, which collapses it
      observer = new MutationObserver(() => {
        if (!ranges.some((range) => range.collapsed)) return;
        ranges = rangesOf($page, located);
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
      else {
        pageHighlights([]);
        onLoad?.({ query });
      }
      // the query stays in the search bar, with its results, to search again
      if (query) input(query);
    };

  const connect = () => {
    const onKeydown = (event: KeyboardEvent) => {
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
      // captured on the window, so it's caught wherever it's dispatched, without
      // the load events of the page's elements (e.g. images), which don't bubble
      // but are captured
      onLoadEvent = (event: Event) => {
        if (event.target instanceof Element) return;
        // results kept across navigations (e.g. astro's transition:persist) are
        // moved into the new page, which collapses their ranges
        queueMicrotask(highlightResults);
        onPageLoad();
      };
    document.addEventListener("keydown", onKeydown);
    addEventListener(loadEvent, onLoadEvent, { capture: true });
    // a page that's still loading is handled once it has, if its load event
    // isn't load itself (which is listened for above)
    if (document.readyState === "complete") onPageLoad();
    else if (loadEvent !== "load") addEventListener("load", onLoadEvent, { once: true });
    return () => {
      document.removeEventListener("keydown", onKeydown);
      removeEventListener(loadEvent, onLoadEvent, { capture: true });
      removeEventListener("load", onLoadEvent);
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
  };
};

type SearchStore<T extends Record<string, unknown> = Record<string, unknown>> = ReturnType<
  typeof createSearch<T>
>;

export { createSearch, type ResultGroup, type SearchOptions, type SearchState, type SearchStore };
