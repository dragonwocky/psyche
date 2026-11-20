import type { IndexOptions, Request, Response, Result } from "./handler";
import { linkOf } from "./href";
import type { Fields, Linked, MatchOptions } from "./match";
import type { RecordMatch } from "./matcher";

type Ask<T extends Record<string, unknown>> = <R extends Request>(
  request: R,
) => Promise<Response<R, T>>;

type SearchOptions<T extends Record<string, unknown> = Record<string, unknown>> = MatchOptions & {
  // the fields searched, and their tiers, sent to the worker
  fields: Fields<T>;
  // the most results a search returns, default: 6
  limit?: number;
  // the results listed for an empty query, default: every entry's
  sitemap?: (result: Result<T>) => boolean;
  // a result's href, the link it's visited by, from its best match's link (its
  // best value's, e.g. a heading's #id, or its page's), default: that link with
  // ?search= the query
  href?: (link: string, result: Omit<Result<T>, "href">, query: string) => string;
  // a data key results are grouped by, in order of their best result
  group?: keyof T & string;
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
  // the page loaded last (see load), its ?search= query, then the record it
  // matched once the index has loaded: the site highlights the page by it (see
  // highlightPage), as its components do themselves
  page: { href?: string; query: string; located?: RecordMatch<T> & { href: string } };
};

const withoutHash = (href: string) => href.replace(/#.*$/, ""),
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

// the search's state and actions, without a framework, markup or the page's DOM:
// a site renders from its state (getState, subscribe), passes its input's query to
// input(), each page it loads to load(), and follows the links visit() returns.
// highlighting (rangesOf, highlight, highlightPage), keyboard shortcuts
// (isShortcut), focus and scrolling are the site's. matching runs in psyche's
// worker, started when first needed
const createSearch = <T extends Record<string, unknown> = Record<string, unknown>>(
  options: SearchOptions<T>,
) => {
  const { fields, group } = options;

  // the index and how it's matched, with its url resolved against the page
  const indexOptions = (): IndexOptions<T> => {
    const { index, limit, excerpt, threshold } = options;
    return {
      index: typeof index === "function" ? index : new URL(index, location.href).href,
      limit,
      excerpt,
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
      if (patch.results) patch.groups = groupsOf(patch.results, group);
      state = { ...state, ...patch };
      for (const listener of listeners) listener(state);
    };

  // a result linked to its best match, by the href option, from the worker's
  // result, which is linked to its entry
  const link = ({ href, ...result }: Result<T>, query: string): Result<T> => ({
      ...result,
      href: new URL(
        (options.href ?? searchHref)(linkOf({ ...result, href }), result, query),
        location.href,
      ).href,
    }),
    // an empty query lists the sitemap
    search = async (query: string) => {
      set({ loading: true });
      const found = await ask(query ? { type: "search", query } : { type: "sitemap" });
      if (query !== state.query) return;
      let results = found.map((result) => link(result, query));
      if (!query && options.sitemap) results = results.filter(options.sitemap);
      set({
        loading: false,
        results,
        selected: Math.max(Math.min(state.selected, results.length - 1), 0),
      });
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
    },
    close = () => {
      if (!state.open) return;
      set({ open: false });
    },
    toggle = () => (state.open ? close() : open()),
    select = (i: number) => set({ selected: Math.max(Math.min(i, state.results.length - 1), 0) }),
    selectPrevious = () => select(state.selected - 1),
    selectNext = () => select(state.selected + 1),
    // clears and closes the search, and returns the result's link for the site to
    // follow, e.g. by its client router; a link within the page loads it again
    visit = (i = state.selected) => {
      const result = state.results[i];
      if (!result) return;
      const here = !!state.page.href && withoutHash(result.href) === withoutHash(state.page.href);
      set({ query: "", results: [] });
      close();
      if (here) load(result.href);
      return result.href;
    };

  // a page the site has loaded, e.g. on its client router's page load: its
  // ?search= query is located, and stays in the search bar to search again
  let loads = 0;
  const load = async (href: string) => {
    const query = new URL(href, location.href).searchParams.get("search") ?? "",
      id = ++loads;
    set({ page: { href, query } });
    if (!query) return;
    input(query);
    const located = await ask({ type: "locate", query, href });
    // a page loaded since is the site's now
    if (id === loads) set({ page: { href, query, located } });
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
    load,
  };
};

type SearchStore<T extends Record<string, unknown> = Record<string, unknown>> = ReturnType<
  typeof createSearch<T>
>;

export { createSearch, type ResultGroup, type SearchOptions, type SearchState, type SearchStore };
