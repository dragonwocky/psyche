// fuzzy matching of queries against values and records: match finds every
// match, with its score, and rank orders them by score
import type { MatchOptions } from "./fuzz";
import { type FieldKey, matchValue, type RecordMatch, type TextMatch } from "./matcher";

// a value without a link: text, or a record, matched by its fields
type Plain = string | Record<string, unknown>;
// a plain value with a link, relative to its record's href (e.g. a heading's
// #id), which a match in it links to: an object of only its value and href
type Linked<P extends Plain = Plain> = { value: P; href: string };
// a field's value, matched against a query: plain or linked, or an array of
// them (e.g. tags, or a page's headings)
type Value = Plain | Linked | readonly (Plain | Linked)[];

// a value's match: each item's for an array, a linked value's with its link,
// and a text's or a record's
type Match<V extends Value = Value> = V extends readonly (infer I extends Value)[]
  ? Match<I>[]
  : V extends Linked<infer P>
    ? Match<P> & { href: string }
    : V extends string
      ? TextMatch
      : V extends Record<string, unknown>
        ? RecordMatch<V>
        : never;

// the fields matched against a query, of any name: each value's score is its
// match's plus its field's tier, so e.g. a title (tier 3) outranks a body (tier 1).
// records within a field score their best value's match, without tiers
type Field<K extends string = string> = { key: K; tier: number };
// a record's fields, or any fields for records without known fields
type Fields<T = Record<string, unknown>> = [FieldKey<T>] extends [never]
  ? readonly Field[]
  : readonly Field<FieldKey<T>>[];

// text needs no fields, and records are matched by them
type Text = string | Linked<string>;
type OptionsOf<V extends Value> = [V] extends [Text | readonly Text[]]
  ? [options?: MatchOptions]
  : [options: MatchOptions & { fields: Fields }];

// a query's every match in a value: text, a record by the fields in options,
// either linked, or an array of them, with their scores: see rank to order them.
// a text is excerpted around its match, and an array's are kept whole. matching
// dispatches on the input at runtime, so its result is typed by its value's here
const match = <V extends Value>(query: string, input: V, ...[options = {}]: OptionsOf<V>) =>
  (Array.isArray(input)
    ? input.map((item) => matchValue(query, item, options, true, false))
    : matchValue(query, input, options, false, false)) as Match<V>;

// matches ordered by score, best first, without those that didn't match:
// at most limit of them, if given
const rank = <M extends { score: number }>(matches: readonly M[], limit = Infinity) =>
  matches
    .filter(({ score }) => score)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

export {
  type Field,
  type Fields,
  type Linked,
  match,
  type Match,
  type MatchOptions,
  type Plain,
  rank,
  type Value,
};
