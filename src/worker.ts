// the site search's matching, off the main thread so typing never waits on it.
// a site's worker module calls createSearchWorker, which fetches and keeps the
// index and answers the client's requests, see createSearchClient
import {
  type FieldsMatch,
  type HeadingMatch,
  matchFields,
  MAX_RESULTS,
  type PsycheRecord,
  RANKING,
  type Ranking,
} from "./match";

// a result leaves out the record's body, which may be a whole page's text,
// as its excerpt is in the match
type Result<Meta = unknown> = Omit<PsycheRecord<Meta>, "body"> & {
  match: FieldsMatch;
  // the best matching heading, which the result links to
  heading?: HeadingMatch;
};

// a record a url links to, as a result's link does, with its match
type Located<Meta = unknown> = { res: PsycheRecord<Meta>; match: FieldsMatch };

type Request =
  // the client's ranking, sent first
  | { type: "init"; ranking: Ranking }
  // fetches the index ahead of a search
  | { type: "load" }
  // the best matching results
  | { type: "search"; query: string }
  // the records listed for an empty query
  | { type: "sitemap" }
  // the record at a url, to highlight on its page
  | { type: "locate"; query: string; href: string };

type Response<R extends Request, Meta = unknown> = R extends { type: "search" | "sitemap" }
  ? Result<Meta>[]
  : R extends { type: "locate" }
    ? Located<Meta> | undefined
    : void;

type WorkerOptions<Meta = unknown> = {
  // the index's url (relative to the worker) or a loader, default: /search.json
  index?: string | (() => Promise<PsycheRecord<Meta>[]>);
  // finds the record a url links to before the record at its path, e.g. a
  // feed entry linked to by a query param
  locate?: (
    records: PsycheRecord<Meta>[],
    query: string,
    url: URL,
  ) => PsycheRecord<Meta> | undefined;
  // the records listed for an empty query, default: those without meta
  sitemap?: (record: PsycheRecord<Meta>) => boolean;
};

const path = (url: URL) => url.pathname.replace(/(.)\/$/, "$1");

// the worker's request handler, apart from its message port for testing
const createHandler = <Meta = unknown>({
  index = "/search.json",
  locate,
  sitemap = (record) => record.meta === undefined,
}: WorkerOptions<Meta> = {}) => {
  let ranking: Ranking = RANKING,
    // fetched once it's needed, then kept. a failed fetch
    // searches nothing, and is tried again the next time
    records: Promise<PsycheRecord<Meta>[]> | undefined;
  const load = (): Promise<PsycheRecord<Meta>[]> =>
      (records ??= (
        typeof index === "string"
          ? fetch(index).then((res) => (res.ok ? res.json() : Promise.reject(res)))
          : index()
      ).catch(() => {
        records = undefined;
        return [];
      })),
    match = (query: string, res: PsycheRecord<Meta>) =>
      matchFields(query, res, ranking) as unknown as FieldsMatch,
    toResult = (res: PsycheRecord<Meta>, match: FieldsMatch): Result<Meta> => {
      const { body: _, ...rest } = res,
        heading = ranking
          .filter((field) => field.type === "headings")
          .flatMap(
            (field) =>
              (match as unknown as Record<string, HeadingMatch[] | undefined>)[field.key] ?? [],
          )
          .find((heading) => heading.match);
      return { ...rest, match, heading };
    };

  return async (request: Request): Promise<unknown> => {
    if (request.type === "init") {
      ranking = request.ranking;
      return;
    }
    const all = await load();
    if (request.type === "search")
      return all
        .map((res) => ({ res, match: match(request.query, res) }))
        .filter(({ match }) => match.score)
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, MAX_RESULTS)
        .map(({ res, match }) => toResult(res, match));
    if (request.type === "sitemap")
      return all.filter(sitemap).map((res) => toResult(res, match("", res)));
    if (request.type === "locate") {
      const url = new URL(request.href),
        res =
          locate?.(all, request.query, url)
          ?? all.find(
            (res) => res.meta === undefined && path(new URL(res.href, url)) === path(url),
          );
      return res && { res, match: match(request.query, res) };
    }
  };
};

// requests are answered by their id, as { id, response }
const createSearchWorker = <Meta = unknown>(options?: WorkerOptions<Meta>) => {
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
