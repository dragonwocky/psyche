import type { IndexOptions, Request, Response, Result } from "./handler";
import { linkOf } from "./href";
import type { Fields, Linked } from "./match";

type SearchOptions<T extends Record<string, unknown> = Record<string, unknown>> = Omit<
  IndexOptions<T>,
  "index"
> & {
  fields: Fields<T>;
  // listed for an empty query, default: every result
  sitemap?: (result: Result<T>) => boolean;
  // from its best match's link (e.g. a heading's #id), default: with ?search=
  href?: (link: string, result: Omit<Result<T>, "href">, query: string) => string;
  // groups are ordered by their best result
  group?: keyof T & string;
} & (
    | {
        // relative to the page, of { href, value: record }[]
        index: string | URL;
        // psyche/worker's url, if a bundler doesn't find it
        worker?: string | URL;
        // the page's origin, not the script's, e.g. for a proxied dev server
        origin?: boolean;
      }
    // matches on the page, e.g. for a small index
    | { worker: false; index: string | URL | (() => Promise<Linked<T>[]>) }
  );

type ResultGroup<T extends Record<string, unknown> = Record<string, unknown>> = {
  group?: string;
  results: { result: Result<T>; index: number }[];
};

type SearchState<T extends Record<string, unknown> = Record<string, unknown>> = {
  open: boolean;
  query: string;
  loading: boolean;
  // or the sitemap, for an empty query
  results: Result<T>[];
  groups: ResultGroup<T>[];
  selected: number;
  // the page loaded last, its ?search= query, and its entry once located
  page: { href?: string; query: string; located?: Result<T> };
};

type SearchStore<T extends Record<string, unknown> = Record<string, unknown>> = ReturnType<
  typeof createSearch<T>
>;

const withoutHash = (href: string) => href.replace(/#.*$/, ""),
  searchHref = (link: string, _result: unknown, query: string) => {
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

// rewritten to ./worker.js by psyche's build, for bundlers that find workers by
// `new Worker(new URL(...))`: Worker is a parameter so origin's keeps that form
const WORKER_URL = "./worker.ts",
  startWorker = (Worker: typeof globalThis.Worker) =>
    new Worker(new URL(WORKER_URL, import.meta.url), { type: "module" }),
  originWorker = () =>
    class extends Worker {
      constructor(url: string | URL, options?: WorkerOptions) {
        const { pathname, search } = new URL(url, location.href);
        super(new URL(pathname + search, location.origin), options);
      }
    };

const createSearch = <T extends Record<string, unknown> = Record<string, unknown>>(
  options: SearchOptions<T>,
) => {
  const { fields, group } = options;

  // lazy, as there's no location on the server
  const indexOptions = (): IndexOptions<T> => {
    const { index, limit, excerpt, threshold } = options;
    return {
      index: typeof index === "function" ? index : new URL(index, location.href).href,
      limit,
      excerpt,
      threshold,
    };
  };

  // replies are matched by id, as they can arrive out of order
  let worker: Worker | undefined,
    handler: Promise<(request: Request) => Promise<unknown>> | undefined,
    requests = 0;
  const pending = new Map<number, (response: never) => void>(),
    ask = <R extends Request>(request: R): Promise<Response<R, T>> => {
      // its own chunk, so matching is only bundled onto the page when used
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
        // e.g. a worker url the site's server doesn't serve
        worker.onerror = (event) => {
          console.error("psyche: the search worker failed", event);
          set({ loading: false });
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
    select = (i: number) => set({ selected: Math.max(Math.min(i, state.results.length - 1), 0) }),
    // following a link within the page won't load it, so it's loaded here
    visit = (i = state.selected) => {
      const result = state.results[i];
      if (!result) return;
      const here = !!state.page.href && withoutHash(result.href) === withoutHash(state.page.href);
      set({ query: "", results: [], loading: false });
      close();
      if (here) load(result.href);
      return result.href;
    };

  let loads = 0;
  const load = async (page: string) => {
    // resolved for visit's comparison, and for the worker, which has no page
    const url = new URL(page, location.href),
      { href } = url,
      query = url.searchParams.get("search") ?? "",
      id = ++loads;
    set({ page: { href, query } });
    if (!query) return;
    input(query);
    const located = await ask({ type: "locate", query, href });
    // another page has loaded since, so this answer is stale
    if (id === loads) set({ page: { href, query, located: located && link(located, query) } });
  };

  return {
    getState: () => state,
    subscribe: (listener: (state: SearchState<T>) => void) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    open,
    close,
    input,
    select,
    visit,
    load,
  };
};

export { createSearch, type ResultGroup, type SearchOptions, type SearchState, type SearchStore };
