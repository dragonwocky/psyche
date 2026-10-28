// the search's matching: fetches and keeps the index and answers the store's
// requests, in the site's worker (see createSearchWorker), or on the page for
// a store without one. not part of the public api
import { resolve } from "./href";
import {
  type Fields,
  type FieldsMatch,
  match,
  type MatchOptions,
  type Linked,
  rank,
  type RecordMatch,
} from "./match";

// a result's fields are their matches, with excerpts of long texts (e.g. a
// page's body), and its record's other values are passed through as data, untouched
type Result<T extends Record<string, unknown> = Record<string, unknown>> = {
  // its link: its entry's, or its best match's value's (e.g. a heading's #id)
  href: string;
  score: number;
  match: FieldsMatch<T>;
  data: T;
};

type Request =
  // the store's fields, sent first
  | { type: "init"; fields: Fields }
  // fetches the index ahead of a search
  | { type: "load" }
  // the best matching results
  | { type: "search"; query: string }
  // the records listed for an empty query
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
    ? RecordMatch<T> | undefined
    : void;

// how the index is loaded and its records matched, by the worker
type WorkerOptions<T extends Record<string, unknown> = Record<string, unknown>> = MatchOptions & {
  // the index's url (relative to the worker, or the page without one)
  // or a loader, default: /search.json. its entries are records linked to
  // their pages, { href, value: record }
  index?: string | (() => Promise<Linked<T>[]>);
  // the most results a search returns, default: 6
  limit?: number;
  // finds the entry a url links to before the first entry at its path, e.g.
  // a list entry linked to by a query param
  locate?: (entries: Linked<T>[], query: string, url: URL) => Linked<T> | undefined;
  // the records listed for an empty query, default: every record
  sitemap?: (record: T) => boolean;
};

const path = (url: URL) => url.pathname.replace(/(.)\/$/, "$1");

// the worker's request handler, apart from its message port
const createHandler = <T extends Record<string, unknown> = Record<string, unknown>>({
  index = "/search.json",
  limit = 6,
  locate,
  sitemap = () => true,
  ...options
}: WorkerOptions<T> = {}) => {
  let fields: Fields = [],
    // fetched once it's needed, then kept. a failed fetch
    // searches nothing, and is tried again the next time
    entries: Promise<Linked<T>[]> | undefined;
  const load = (): Promise<Linked<T>[]> =>
      (entries ??= (
        typeof index === "string"
          ? fetch(index).then((res) => (res.ok ? res.json() : Promise.reject(res)))
          : index()
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
    // results are sent without their records, only their matches and data
    toResult = ({ record, href: link, ...match }: RecordMatch<T> & { href: string }): Result<T> => {
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(record))
        if (!fields.some((field) => field.key === key)) data[key] = value;
      const best = match.best && (match as Record<string, unknown>)[match.best.key],
        value = Array.isArray(best) ? best[match.best!.index!] : best,
        href = (value as { href?: string } | undefined)?.href;
      return {
        href: href ? resolve(href, link) : link,
        score: match.score,
        match: match as FieldsMatch<T>,
        data: data as Result<T>["data"],
      };
    };

  return async (request: Request): Promise<unknown> => {
    if (request.type === "init") {
      fields = request.fields;
      return;
    }
    const all = await load();
    if (request.type === "search") return rank(matchAll(request.query, all), limit).map(toResult);
    if (request.type === "sitemap")
      return matchAll(
        "",
        all.filter(({ value }) => sitemap(value)),
      ).map(toResult);
    if (request.type === "locate") {
      const url = new URL(request.href),
        entry =
          locate?.(all, request.query, url)
          ?? all.find(({ href }) => path(new URL(href, url)) === path(url));
      return entry && matchAll(request.query, [entry])[0];
    }
  };
};

export { createHandler, type Request, type Response, type Result, type WorkerOptions };
