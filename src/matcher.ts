// matching values and records, as match does, typed for generic records so
// psyche's own code needs no casts: match's Match<S> resolves to these types.
// not part of the public api
import { balance, fuzz, type MatchOptions } from "./fuzz";
import type { Fields, Linked, Match, Shape } from "./match";

// the keys of a record whose values are fields' shapes, not an index's
type FieldKey<T> = {
  [K in keyof T]-?: string extends K ? never : NonNullable<T[K]> extends Shape ? K & string : never;
}[keyof T];

// a text's match: its value, as an excerpt around the match (an array's items
// are kept whole), the text it matched, and its score (0 for none, to 1)
type TextMatch = { value: string; match?: string; score: number };
// a record's match: its value, the record, its best match's field (and item,
// for an array field), each field's match, matched or not (none for a record
// without the field), and its score: its best value's plus its field's tier
type RecordMatch<T extends Record<string, unknown> = Record<string, unknown>> = {
  value: T;
  match?: { key: string; index?: number };
  matches: {
    [K in FieldKey<T>]?: NonNullable<T[K]> extends infer F extends Shape ? Match<F> : never;
  };
  score: number;
};
// a text's or a record's match, with its link if it's linked
type AnyMatch = (TextMatch | RecordMatch) & { href?: string };

type Options = MatchOptions & { fields?: Fields };

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value),
  isLinked = (value: unknown): value is Linked =>
    isRecord(value)
    && typeof value.href === "string"
    && (typeof value.value === "string" || isRecord(value.value))
    && Object.keys(value).length === 2;

// a text's match, excerpted around it, or kept whole
const matchText = (query: string, text: string, options: Options, whole: boolean): TextMatch => {
    const fuzzed = fuzz(query, text, options.threshold),
      excerpt = balance(fuzzed, text, options);
    return {
      value: whole ? text : excerpt.text,
      ...(excerpt.match === undefined ? {} : { match: excerpt.match }),
      score: fuzzed[0],
    };
  },
  // a value's match, or none for a value that isn't text or a record
  matchValue = (
    query: string,
    value: unknown,
    options: Options,
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
  matchRecord = <T extends Record<string, unknown>>(
    query: string,
    record: T,
    options: Options,
    nested: boolean,
  ): RecordMatch<T> => {
    // each field's match, by the fields' keys, as RecordMatch's matches are
    const matches: Record<string, AnyMatch | AnyMatch[]> = {},
      result: RecordMatch<T> = {
        value: record,
        matches: matches as RecordMatch<T>["matches"],
        score: 0,
      },
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
  },
  // each index entry's match: its record's, with its link
  matchEntries = <T extends Record<string, unknown>>(
    query: string,
    entries: Linked<T>[],
    options: Options,
  ): (RecordMatch<T> & { href: string })[] =>
    entries.map(({ value, href }) => ({ ...matchRecord(query, value, options, false), href }));

export {
  type AnyMatch,
  type FieldKey,
  isLinked,
  isRecord,
  matchEntries,
  matchValue,
  type Options,
  type RecordMatch,
  type TextMatch,
};
