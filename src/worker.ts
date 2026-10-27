// the site search's matching, off the main thread so typing never waits on it.
// a site's worker module calls createSearchWorker, which fetches and keeps the
// index and answers the store's requests, see createSearch
import {
  type Fields,
  type FieldsMatch,
  matchFields,
  MAX_RESULTS,
  type PsycheRecord,
} from "./match";

// a result's fields are their matches, with excerpts of long texts (e.g. a
// page's body), and its other values are passed through as data, untouched
type Result<T extends PsycheRecord = PsycheRecord> = {
  href: string;
  score: number;
  match: FieldsMatch<T>;
  // the id of the best match's value (e.g. a heading's), which the result links to
  anchor?: string;
  data: Omit<T, "href">;
};

// a record a url links to, as a result's link does, with its match
type Located<T extends PsycheRecord = PsycheRecord> = { record: T; match: FieldsMatch<T> };

type Request =
  // the store's fields, sent first
  | { type: "init"; fields: Fields }
  // fetches the index ahead of a search
  | { type: "load" }
  // the best matching results
  | { type: "search"; query: string }
  // the records listed for an empty query
  | { type: "sitemap" }
  // the record at a url, to highlight on its page
  | { type: "locate"; query: string; href: string };

type Response<R extends Request, T extends PsycheRecord = PsycheRecord> = R extends {
  type: "search" | "sitemap";
}
  ? Result<T>[]
  : R extends { type: "locate" }
    ? Located<T> | undefined
    : void;

type WorkerOptions<T extends PsycheRecord = PsycheRecord> = {
  // the index's url (relative to the worker) or a loader, default: /search.json
  index?: string | (() => Promise<T[]>);
  // finds the record a url links to before the first record at its path, e.g.
  // a list entry linked to by a query param
  locate?: (records: T[], query: string, url: URL) => T | undefined;
  // the records listed for an empty query, default: every record
  sitemap?: (record: T) => boolean;
};

const path = (url: URL) => url.pathname.replace(/(.)\/$/, "$1");

// the worker's request handler, apart from its message port for testing
const createHandler = <T extends PsycheRecord = PsycheRecord>({
  index = "/search.json",
  locate,
  sitemap = () => true,
}: WorkerOptions<T> = {}) => {
  let fields: Fields = [],
    // fetched once it's needed, then kept. a failed fetch
    // searches nothing, and is tried again the next time
    records: Promise<T[]> | undefined;
  const load = (): Promise<T[]> =>
      (records ??= (
        typeof index === "string"
          ? fetch(index).then((res) => (res.ok ? res.json() : Promise.reject(res)))
          : index()
      ).catch(() => {
        records = undefined;
        return [];
      })),
    match = (query: string, record: T) => matchFields<T>(query, record, fields),
    toResult = (record: T, match: FieldsMatch<T>): Result<T> => {
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(record))
        if (key !== "href" && !fields.some((field) => field.key === key)) data[key] = value;
      const best = match.best && (match as Record<string, unknown>)[match.best.key],
        value = Array.isArray(best) ? best[match.best!.index!] : best,
        anchor = (value as { id?: string } | undefined)?.id;
      return {
        href: record.href,
        score: match.score,
        match,
        ...(anchor ? { anchor } : {}),
        data: data as Result<T>["data"],
      };
    };

  return async (request: Request): Promise<unknown> => {
    if (request.type === "init") {
      fields = request.fields;
      return;
    }
    const all = await load();
    if (request.type === "search")
      return all
        .map((record) => ({ record, match: match(request.query, record) }))
        .filter(({ match }) => match.score)
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, MAX_RESULTS)
        .map(({ record, match }) => toResult(record, match));
    if (request.type === "sitemap")
      return all.filter(sitemap).map((record) => toResult(record, match("", record)));
    if (request.type === "locate") {
      const url = new URL(request.href),
        record =
          locate?.(all, request.query, url)
          ?? all.find((record) => path(new URL(record.href, url)) === path(url));
      return record && { record, match: match(request.query, record) };
    }
  };
};

// requests are answered by their id, as { id, response }
const createSearchWorker = <T extends PsycheRecord = PsycheRecord>(options?: WorkerOptions<T>) => {
  const handle = createHandler(options);
  self.onmessage = async ({ data }: MessageEvent<Request & { id: number }>) => {
    const response = await handle(data);
    self.postMessage({ id: data.id, response });
  };
};

export {
  createHandler,
  createSearchWorker,
  type Located,
  type Request,
  type Response,
  type Result,
  type WorkerOptions,
};
