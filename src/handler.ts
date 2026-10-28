// the search's matching: fetches and keeps the index and answers the store's
// requests, in the site's worker (see createSearchWorker), or on the page for
// a store without one. not part of the public api
import {
  type Fields,
  match,
  type MatchOptions,
  type Linked,
  rank,
  type RecordMatch,
} from "./match";

// a result: its index entry's match, linked to its page, with its record's
// other values passed through untouched. its searched values are left out of
// its value, as their matches (with excerpts of long texts, e.g. a page's
// body) stand in for them
type Result<T extends Record<string, unknown> = Record<string, unknown>> = Omit<
  RecordMatch<T>,
  "value" | "href"
> & { value: Partial<T>; href: string };

// how the index is loaded and its entries matched, sent to the worker
type IndexOptions<T extends Record<string, unknown> = Record<string, unknown>> = MatchOptions & {
  // the index's url, or a loader on the page (without a worker). its entries
  // are records linked to their pages, { href, value: record }
  index: string | (() => Promise<Linked<T>[]>);
  // the most results a search returns, default: 6
  limit?: number;
};

type Request =
  // the store's fields and options, sent first
  | { type: "init"; fields: Fields; options: IndexOptions }
  // fetches the index ahead of a search
  | { type: "load" }
  // the best matching results
  | { type: "search"; query: string }
  // every entry's result, for an empty query
  | { type: "sitemap" }
  // the entry at a url, to highlight on its page
  | { type: "locate"; query: string; href: string };

type Response<
  R extends Request,
  T extends Record<string, unknown> = Record<string, unknown>,
> = R extends {
  type: "search" | "sitemap";
}
  ? Result<T>[]
  : R extends { type: "locate" }
    ? (RecordMatch<T> & { href: string }) | undefined
    : void;

const path = (url: URL) => url.pathname.replace(/(.)\/$/, "$1"),
  // the entry a url links to: of those at its path, the one with the most of
  // its query's params, so an entry linked to by a param (e.g. a list's
  // ?entry=) is found before its page
  locate = <E extends { href: string }>(entries: E[], url: URL) => {
    let found: E | undefined,
      most = -1;
    for (const entry of entries) {
      const link = new URL(entry.href, url),
        params = [...link.searchParams];
      if (path(link) !== path(url) || params.length <= most) continue;
      if (!params.every(([key, value]) => url.searchParams.getAll(key).includes(value))) continue;
      found = entry;
      most = params.length;
    }
    return found;
  };

// the worker's request handler, apart from its message port
const createHandler = <T extends Record<string, unknown> = Record<string, unknown>>() => {
  let fields: Fields = [],
    options: IndexOptions<T> = { index: "/search.json" },
    // fetched once it's needed, then kept. a failed fetch
    // searches nothing, and is tried again the next time
    entries: Promise<Linked<T>[]> | undefined;
  const load = (): Promise<Linked<T>[]> =>
      (entries ??= (
        typeof options.index === "string"
          ? fetch(options.index).then((res) => (res.ok ? res.json() : Promise.reject(res)))
          : options.index()
      ).catch(() => {
        entries = undefined;
        return [];
      })),
    // each entry's match, by the store's fields
    matchAll = (query: string, entries: Linked<T>[]) =>
      match(query, entries as Linked<Record<string, unknown>>[], {
        ...options,
        fields,
      }) as (RecordMatch<T> & {
        href: string;
      })[],
    // results are sent without their searched values, only their matches
    toResult = ({ value, ...match }: RecordMatch<T> & { href: string }): Result<T> => {
      const rest: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value))
        if (!fields.some((field) => field.key === key)) rest[key] = item;
      return { ...match, value: rest as Partial<T> };
    };

  return async (request: Request): Promise<unknown> => {
    if (request.type === "init") {
      ({ fields } = request);
      options = request.options as IndexOptions<T>;
      return;
    }
    const all = await load();
    if (request.type === "search")
      return rank(matchAll(request.query, all), options.limit ?? 6).map(toResult);
    if (request.type === "sitemap") return matchAll("", all).map(toResult);
    if (request.type === "locate") {
      const entry = locate(all, new URL(request.href));
      return entry && matchAll(request.query, [entry])[0];
    }
  };
};

export { createHandler, type IndexOptions, type Request, type Response, type Result };
