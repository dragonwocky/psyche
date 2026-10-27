import { createSignal } from "solid-js";

import { RANKING, type Ranking } from "./match";
import type { Request, Response, Result } from "./worker";

type ClientOptions<Meta = unknown> = {
  // the fields searched, sent to the worker, default: RANKING
  ranking?: Ranking;
  // loads the worker from the page's origin rather than the script's, e.g. when
  // scripts come from a dev server on another port that the page's server proxies
  origin?: boolean;
  // a result's link, default: its href with ?search= the query. results that
  // matched a heading link to its #id, unless the link has a hash of its own
  href?: (result: Result<Meta>, query: string) => string;
};

const searchHref = (result: Result, query: string) => {
  const url = new URL(result.href, location.href);
  if (query) url.searchParams.set("search", query);
  return url.href;
};

// matching runs in a worker, started when first needed (when the search opens
// or a page loads with a ?search= query to highlight). requests are answered by
// id, as they may be answered after newer ones
const createSearchClient = <Meta = unknown>(
  workerUrl: string | URL,
  { ranking = RANKING, origin = false, href = searchHref }: ClientOptions<Meta> = {},
) => {
  let worker: Worker | undefined,
    requests = 0;
  const pending = new Map<number, (response: never) => void>(),
    url = () => {
      const url = new URL(workerUrl, location.href);
      return origin ? new URL(url.pathname + url.search, location.origin) : url;
    },
    ask = <R extends Request>(request: R) => {
      if (!worker) {
        worker = new Worker(url(), { type: "module" });
        worker.onmessage = ({ data }: MessageEvent<{ id: number; response: never }>) => {
          pending.get(data.id)?.(data.response);
          pending.delete(data.id);
        };
        worker.postMessage({ type: "init", ranking, id: 0 } satisfies Request & { id: number });
      }
      const id = ++requests;
      worker.postMessage({ ...request, id });
      return new Promise<Response<R, Meta>>((resolve) => pending.set(id, resolve));
    },
    link = (result: Result<Meta>, query: string) => {
      const url = new URL(href(result, query), location.href);
      if (result.heading && !url.hash) url.hash = result.heading.id;
      return url.href;
    };
  return { ask, href: link, ranking };
};

type SearchClient<Meta = unknown> = ReturnType<typeof createSearchClient<Meta>>;

// the search panel's state, shared by its triggers (e.g. a search button)
const [isSearchOpen, setSearchOpen] = createSignal(false),
  openSearch = () => setSearchOpen(true),
  closeSearch = () => setSearchOpen(false),
  toggleSearch = () => setSearchOpen((open) => !open);

export {
  type ClientOptions,
  closeSearch,
  createSearchClient,
  isSearchOpen,
  openSearch,
  type SearchClient,
  toggleSearch,
};
