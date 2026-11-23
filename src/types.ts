import type { createSearch } from "./store";

// text, or a record, matched by its fields
type Plain = string | Record<string, unknown>;
// linked relative to its record's href (e.g. a heading's #id), by only these two keys
type Linked<P extends Plain = Plain> = { value: P; href: string };
// a field's value: plain or linked, or an array of them (e.g. tags, headings)
type Value = Plain | Linked | readonly (Plain | Linked)[];
// the keys of a record whose values can be fields' values
type FieldKey<T> = {
  [K in keyof T]-?: string extends K ? never : NonNullable<T[K]> extends Value ? K & string : never;
}[keyof T];
// any fields, for records without known ones. a value scores its match plus its
// field's tier, without tiers within a field's records
type Fields<T = Record<string, unknown>> = readonly {
  key: [FieldKey<T>] extends [never] ? string : FieldKey<T>;
  tier: number;
}[];

type Options<T extends Record<string, unknown> = Record<string, unknown>> = {
  fields: Fields<T>;
  // the most results a search returns, default: 6
  limit?: number;
  // the most characters an excerpt keeps, default: 192
  length?: number;
  // the least share of a match's span its characters fill, 0 to 1, default: 0.4
  threshold?: number;
  // listed for an empty query, default: every result
  sitemap?: (result: Result<T>) => boolean;
  // from its best match's link (e.g. a heading's #id), default: with ?search=
  href?: (link: string, result: Omit<Result<T>, "href">, query: string) => string;
  // groups are ordered by their best result
  group?: keyof T & string;
} & (
  | {
      // relative to the page, of entries: { href, value: record }[]
      index: string | URL;
      // psyche/worker's url, if a bundler doesn't find it
      worker?: string | URL;
      // the page's origin, not the script's, e.g. for a proxied dev server
      origin?: boolean;
    }
  // matches on the page, e.g. for a small index
  | { worker: false; index: string | URL | (() => Promise<Linked<T>[]>) }
);
// text needs no fields, and records are matched by them
type OptionsOf<V extends Value> = [V] extends [
  string | Linked<string> | readonly (string | Linked<string>)[],
]
  ? [options?: Pick<Partial<Options>, "length" | "threshold">]
  : [options: Pick<Options, "fields" | "length" | "threshold">];

// a text's value is excerpted around its match (whole in an array), scored 0 to 1
type Match<V extends Plain | Linked = Plain | Linked> =
  V extends Linked<infer P>
    ? Match<P> & { href: string }
    : V extends string
      ? { value: string; match?: string; score: number }
      : V extends Record<string, unknown>
        ? RecordMatch<V>
        : never;
// scored by its best value: its match plus its field's tier
type RecordMatch<T extends Record<string, unknown> = Record<string, unknown>> = {
  value: T;
  match?: { key: string; index?: number };
  matches: {
    [K in FieldKey<T>]?: NonNullable<T[K]> extends readonly (infer I extends Plain | Linked)[]
      ? Match<I>[]
      : NonNullable<T[K]> extends infer F extends Plain | Linked
        ? Match<F>
        : never;
  };
  score: number;
};
// a match, an array's, or matches keyed by field
type Matched =
  | Match
  | readonly Match[]
  | { readonly [key: string]: Match | readonly Match[] | undefined };

// an entry's match, without its searched values, which its matches stand in for
type Result<T extends Record<string, unknown> = Record<string, unknown>> = Omit<
  RecordMatch<T>,
  "value"
> & { value: Partial<T>; href: string };
type ResultGroup<T extends Record<string, unknown> = Record<string, unknown>> = {
  group?: string;
  results: { result: Result<T>; index: number }[];
};

type State<T extends Record<string, unknown> = Record<string, unknown>> = {
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
type Store<T extends Record<string, unknown> = Record<string, unknown>> = ReturnType<
  typeof createSearch<T>
>;

type Request =
  // sent first
  | {
      type: "init";
      fields: Fields;
      options: Pick<Options, "index" | "limit" | "length" | "threshold">;
    }
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

type Target = Element | null | undefined;
// a match's elements, shaped as it is: per value, array item or field, or a page
type Targets = Target | readonly Target[] | { readonly [key: string]: Targets };

export type {
  FieldKey,
  Fields,
  Linked,
  Match,
  Matched,
  Options,
  OptionsOf,
  Plain,
  RecordMatch,
  Request,
  Response,
  Result,
  ResultGroup,
  State,
  Store,
  Target,
  Targets,
  Value,
};
