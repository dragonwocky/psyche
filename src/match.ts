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

// a text's match: its score (0 for none, to 1), and an excerpt of its text
// around the match (an array's items are kept whole)
type ValueMatch = { text: string; match?: string; href?: string; score: number };
// a value's match: its text's, or its record's, with its link if it's linked
type MatchOf<V> = V extends string
  ? ValueMatch
  : V extends Linked<infer W>
    ? W extends string
      ? ValueMatch
      : RecordMatch<W>
    : RecordMatch<V>;
type FieldMatch<V> = V extends readonly (infer I)[] ? MatchOf<I>[] : MatchOf<V>;

// the fields matched against a query, of any name: each value's score is its
// match's plus its field's tier, so e.g. a title (tier 3) outranks a body (tier 1).
// records within a field score their best value's match, without tiers
type Field<K extends string = string> = { key: K; tier: number };
type Fields = readonly Field[];

// the keys of a record whose values are fields' shapes, not an index's (the
// rest are its match's own)
type FieldKey<T> = Exclude<
  {
    [K in keyof T]-?: string extends K
      ? never
      : NonNullable<T[K]> extends Shape
        ? K & string
        : never;
  }[keyof T],
  "href" | "record" | "score" | "best"
>;
// a record's fields, or any fields for records without a known shape
type FieldsOf<T> = [FieldKey<T>] extends [never] ? Fields : readonly Field<FieldKey<T>>[];

// each field's match (none for a record without the field), and the best: its
// score, which is its value's plus its field's tier, and its field, and its item
// for an array field
type FieldsMatch<T = Record<string, unknown>> = {
  [K in FieldKey<T>]?: FieldMatch<NonNullable<T[K]>>;
} & { score: number; best?: { key: string; index?: number } };
// a record's match, with the record, and its link if it's linked
type RecordMatch<T = Record<string, unknown>> = FieldsMatch<T> & { record: T; href?: string };

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
      text: whole ? text : excerpt.text,
      ...(excerpt.match === undefined ? {} : { match: excerpt.match }),
      score: fuzzed[0],
    } as ValueMatch;
  },
  // a value's match, or none for a value that isn't text or a record
  matchValue = (
    query: string,
    value: unknown,
    options: MatchOptions & { fields?: Fields },
    whole: boolean,
    nested: boolean,
  ): ValueMatch | RecordMatch | undefined => {
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
    const result: Record<string, unknown> & { score: number } = { record, score: 0 },
      best = (score: number, key: string, index?: number) => {
        if (!score || score <= result.score) return;
        result.score = score;
        result.best = index === undefined ? { key } : { key, index };
      };
    for (const { key, tier: fieldTier } of options.fields ?? []) {
      const value = record[key],
        tier = nested ? 0 : fieldTier;
      if (Array.isArray(value)) {
        const items = value
          .map((item) => matchValue(query, item, options, true, true))
          .filter((item) => item !== undefined);
        result[key] = items;
        items.forEach((item, index) => best(item.score && item.score + tier, key, index));
      } else {
        const item = matchValue(query, value, options, false, true);
        if (!item) continue;
        result[key] = item;
        best(item.score && item.score + tier, key);
      }
    }
    return result as RecordMatch;
  };

// text needs no fields, and records are matched by them
type OptionsOf<V> = [V] extends [string | Linked<string>]
  ? [options?: MatchOptions]
  : [options: MatchOptions & { fields: Fields }];
type Match = {
  // each value's match, with texts kept whole
  <V extends Value | Linked>(
    query: string,
    values: readonly V[],
    ...options: OptionsOf<V>
  ): MatchOf<V>[];
  // a value's match, with a text excerpted around it
  <V extends Value | Linked>(query: string, value: V, ...options: OptionsOf<V>): MatchOf<V>;
};

// a query's every match in a value or values (text, or records by the fields in
// options, either linked), with their scores: see rank to order them
const match = ((query: string, input: unknown, options: MatchOptions & { fields?: Fields } = {}) =>
  Array.isArray(input)
    ? input.map((item) => matchValue(query, item, options, true, false))
    : matchValue(query, input, options, false, false)) as Match;

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
  type MatchOf,
  type MatchOptions,
  rank,
  type RecordMatch,
  type Shape,
  type Value,
  type ValueMatch,
};
