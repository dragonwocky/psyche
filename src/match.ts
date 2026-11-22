// fuzzy matching of values and records: match finds every match, rank orders them
import { balance, fuzz, type MatchOptions } from "./fuzz";

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
// a text's value is excerpted around its match (whole in an array), scored 0 to 1
type Match<V extends Plain | Linked = Plain | Linked> =
  V extends Linked<infer P>
    ? Match<P> & { href: string }
    : V extends string
      ? { value: string; match?: string; score: number }
      : V extends Record<string, unknown>
        ? RecordMatch<V>
        : never;

type Options = MatchOptions & { fields?: Fields };
// text needs no fields, and records are matched by them
type OptionsOf<V extends Value> = [V] extends [
  string | Linked<string> | readonly (string | Linked<string>)[],
]
  ? [options?: MatchOptions]
  : [options: MatchOptions & { fields: Fields }];

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value),
  isLinked = (value: unknown): value is Linked =>
    isRecord(value)
    && typeof value.href === "string"
    && (typeof value.value === "string" || isRecord(value.value))
    && Object.keys(value).length === 2;

// nested records score without tiers; none for a value that isn't text or a record
const matchValue = (
    query: string,
    value: unknown,
    options: Options,
    whole: boolean,
    nested: boolean,
  ): Match | Match[] | undefined => {
    if (Array.isArray(value))
      return value
        .map((item) => matchValue(query, item, options, true, nested) as Match | undefined)
        .filter((item) => item !== undefined);
    if (isLinked(value)) {
      const matched = matchValue(query, value.value, options, whole, nested) as Match;
      return matched && { ...matched, href: value.href };
    }
    if (typeof value === "string") {
      const fuzzed = fuzz(query, value, options.threshold),
        excerpt = balance(fuzzed, value, options);
      return {
        value: whole ? value : excerpt.text,
        ...(excerpt.match === undefined ? {} : { match: excerpt.match }),
        score: fuzzed[0],
      };
    }
    if (isRecord(value)) return matchRecord(query, value, options, nested);
  },
  // typed for generic records, so psyche's own code needs no casts
  matchRecord = <T extends Record<string, unknown>>(
    query: string,
    record: T,
    options: Options,
    nested = false,
  ): RecordMatch<T> => {
    const matches: Record<string, Match | Match[]> = {},
      result: RecordMatch<T> = { value: record, matches: matches as never, score: 0 },
      best = (item: Match, tier: number, key: string, index?: number) => {
        const score = item.score && item.score + tier;
        if (!score || score <= result.score) return;
        result.score = score;
        result.match = index === undefined ? { key } : { key, index };
      };
    for (const { key, tier } of options.fields ?? []) {
      const item = matchValue(query, record[key], options, false, true);
      if (!item) continue;
      matches[key] = item;
      if (Array.isArray(item)) item.forEach((each, i) => best(each, nested ? 0 : tier, key, i));
      else best(item, nested ? 0 : tier, key);
    }
    return result;
  };

// dispatches at runtime, so its result is typed here
const match = <V extends Value>(query: string, input: V, ...[options = {}]: OptionsOf<V>) =>
  matchValue(query, input, options, false, false) as V extends readonly (infer I extends
    | Plain
    | Linked)[]
    ? Match<I>[]
    : V extends Plain | Linked
      ? Match<V>
      : never;

// best first, without those that didn't match
const rank = <M extends { score: number }>(matches: readonly M[], limit = Infinity) =>
  matches
    .filter(({ score }) => score)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

export {
  type Fields,
  type Linked,
  match,
  type Match,
  matchRecord,
  rank,
  type RecordMatch,
  type Value,
};
