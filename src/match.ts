// fuzzy matching of queries against values and records: match finds every
// match, with its score, and rank orders them by score
import { balance, fuzz, type MatchOptions } from "./fuzz";

// a value matched against a query: text, or a record, matched by its fields
type Value = string | Record<string, unknown>;
// a value with a link, relative to its record's href (e.g. a heading's #id),
// which a match in it links to: an object of only its value and href
type Linked<V extends Value = Value> = { value: V; href: string };
// a field's value: a value, linked or not, or an array of them (e.g. tags, or
// a page's headings)
type Shape = Value | Linked | readonly (Value | Linked)[];

// a shape's match: each item's for an array, and a linked value's with its link.
// a text's has its value, as an excerpt around the match (an array's items are
// kept whole), the text it matched, and its score (0 for none, to 1). a record's
// has its value, the record, its best match's field (and item, for an array
// field), each field's match, matched or not (none for a record without the
// field), and its score: its best value's plus its field's tier
type Match<S extends Shape = Shape> = S extends readonly (infer I extends Shape)[]
  ? Match<I>[]
  : S extends Linked<infer V>
    ? Match<V> & { href: string }
    : S extends string
      ? { value: string; match?: string; score: number }
      : {
          value: S;
          match?: { key: string; index?: number };
          matches: {
            [K in FieldKey<S>]?: NonNullable<S[K]> extends infer F extends Shape ? Match<F> : never;
          };
          score: number;
        };

// the fields matched against a query, of any name: each value's score is its
// match's plus its field's tier, so e.g. a title (tier 3) outranks a body (tier 1).
// records within a field score their best value's match, without tiers
type Field<K extends string = string> = { key: K; tier: number };
type Fields = readonly Field[];

// the keys of a record whose values are fields' shapes, not an index's
type FieldKey<T> = {
  [K in keyof T]-?: string extends K ? never : NonNullable<T[K]> extends Shape ? K & string : never;
}[keyof T];
// a record's fields, or any fields for records without a known shape
type FieldsOf<T> = [FieldKey<T>] extends [never] ? Fields : readonly Field<FieldKey<T>>[];

// a text's or a record's match, as it's matched, with its link if it's linked
type AnyMatch = (Match<string> | Match<Record<string, unknown>>) & { href?: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value),
  isLinked = (value: unknown): value is Linked =>
    isRecord(value)
    && typeof value.href === "string"
    && (typeof value.value === "string" || isRecord(value.value))
    && Object.keys(value).length === 2;

// a text's match, excerpted around it, or kept whole
const matchText = (query: string, text: string, options: MatchOptions, whole: boolean) => {
    const fuzzed = fuzz(query, text, options.threshold),
      excerpt = balance(fuzzed, text, options);
    return {
      value: whole ? text : excerpt.text,
      ...(excerpt.match === undefined ? {} : { match: excerpt.match }),
      score: fuzzed[0],
    } as Match<string>;
  },
  // a value's match, or none for a value that isn't text or a record
  matchValue = (
    query: string,
    value: unknown,
    options: MatchOptions & { fields?: Fields },
    whole: boolean,
    nested: boolean,
  ): AnyMatch | undefined => {
    if (isLinked(value)) {
      const matched = matchValue(query, value.value, options, whole, nested);
      return matched && { ...matched, href: value.href };
    }
    if (typeof value === "string") return matchText(query, value, options, whole);
    if (isRecord(value)) return matchRecord(query, value, options, nested);
  },
  // each of a record's fields' values' matches (array fields' items kept whole),
  // and its best value's, by its score plus its field's tier, or without tiers
  // for a record within a field. a list of fields shared by records of other
  // shapes may name fields a record lacks
  matchRecord = (
    query: string,
    record: Record<string, unknown>,
    options: MatchOptions & { fields?: Fields },
    nested: boolean,
  ) => {
    const matches: Record<string, unknown> = {},
      result: Match<Record<string, unknown>> = { value: record, matches, score: 0 },
      best = (score: number, key: string, index?: number) => {
        if (!score || score <= result.score) return;
        result.score = score;
        result.match = index === undefined ? { key } : { key, index };
      };
    for (const { key, tier: fieldTier } of options.fields ?? []) {
      const value = record[key],
        tier = nested ? 0 : fieldTier;
      if (Array.isArray(value)) {
        const items = value
          .map((item) => matchValue(query, item, options, true, true))
          .filter((item) => item !== undefined);
        matches[key] = items;
        items.forEach((item, index) => best(item.score && item.score + tier, key, index));
      } else {
        const item = matchValue(query, value, options, false, true);
        if (!item) continue;
        matches[key] = item;
        best(item.score && item.score + tier, key);
      }
    }
    return result;
  };

// text needs no fields, and records are matched by them
type Text = string | Linked<string>;
type OptionsOf<S extends Shape> = [S] extends [Text | readonly Text[]]
  ? [options?: MatchOptions]
  : [options: MatchOptions & { fields: Fields }];

// a query's every match in a shape: text, a record by the fields in options,
// either linked, or an array of them, with their scores: see rank to order them.
// a text is excerpted around its match, and an array's are kept whole
const match = <S extends Shape>(query: string, input: S, ...[options = {}]: OptionsOf<S>) => {
  const all = options as MatchOptions & { fields?: Fields };
  return (
    Array.isArray(input)
      ? input.map((item) => matchValue(query, item, all, true, false))
      : matchValue(query, input, all, false, false)
  ) as Match<S>;
};

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
  type FieldsOf,
  type Linked,
  match,
  type Match,
  type MatchOptions,
  rank,
  type Shape,
  type Value,
};
