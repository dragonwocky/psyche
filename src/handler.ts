// fetches the index and answers the store's requests, in the worker or on the page
import type { MatchOptions } from "./fuzz";
import { type Fields, type Linked, matchRecord, rank, type RecordMatch } from "./match";

// an entry's match, without its searched values, which its matches stand in for
type Result<T extends Record<string, unknown> = Record<string, unknown>> = Omit<
  RecordMatch<T>,
  "value"
> & { value: Partial<T>; href: string };

// the matching's share of SearchOptions
type IndexOptions<T extends Record<string, unknown> = Record<string, unknown>> = MatchOptions & {
  // a resolved url, or a loader on the page
  index: string | (() => Promise<Linked<T>[]>);
  // the most results a search returns, default: 6
  limit?: number;
};

type Request =
  // sent first
  | { type: "init"; fields: Fields; options: IndexOptions }
  // fetches the index ahead of a search
  | { type: "load" }
  | { type: "search"; query: string }
  // for an empty query
  | { type: "sitemap" }
  // a landing page's entry
  | { type: "locate"; query: string; href: string };

type Response<
  R extends Request,
  T extends Record<string, unknown> = Record<string, unknown>,
> = R extends {
  type: "search" | "sitemap";
}
  ? Result<T>[]
  : R extends { type: "locate" }
    ? Result<T> | undefined
    : void;

const path = (url: URL) => url.pathname.replace(/(.)\/$/, "$1"),
  // of the entries at a url's path, the one with the most of its params, so a
  // list's ?entry= is found before the list
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

// the worker's handler, without its message port
const createHandler = <T extends Record<string, unknown> = Record<string, unknown>>() => {
  let fields: Fields = [],
    // sent by init, before any other request
    options: IndexOptions<T> | undefined,
    // kept once fetched; a failed fetch finds nothing, and is retried next time
    entries: Promise<Linked<T>[]> | undefined;
  const load = (): Promise<Linked<T>[]> =>
      !options
        ? Promise.resolve([])
        : (entries ??= (
            typeof options.index === "string"
              ? fetch(options.index).then((res) => (res.ok ? res.json() : Promise.reject(res)))
              : options.index()
          ).catch(() => {
            entries = undefined;
            return [];
          })),
    matchAll = (query: string, entries: Linked<T>[]) =>
      entries.map(({ value, href }) => ({
        ...matchRecord(query, value, { ...options, fields }),
        href,
      })),
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
      return rank(matchAll(request.query, all), options?.limit ?? 6).map(toResult);
    if (request.type === "sitemap") return matchAll("", all).map(toResult);
    if (request.type === "locate") {
      const entry = locate(all, new URL(request.href));
      return entry && toResult(matchAll(request.query, [entry])[0]);
    }
  };
};

export { createHandler, type IndexOptions, type Request, type Response, type Result };
