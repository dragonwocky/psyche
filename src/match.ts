// fuzzy matching of values and records: match finds every match, rank orders them
import { find, trim } from "./fuzz";
import type { Linked, Match, Options, OptionsOf, Plain, RecordMatch, Value } from "./types";

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
    options: Pick<Partial<Options>, "fields" | "length" | "threshold">,
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
      // a text without a match still scores 0, excerpted from its start
      let match = find(query, value);
      if (match && match.score < (options.threshold ?? 0.4)) match = undefined;
      const excerpt = trim(value, match?.match, options.length);
      return {
        value: whole ? value : excerpt.haystack,
        ...(excerpt.match === undefined ? {} : { match: excerpt.match }),
        score: match?.score ?? 0,
      };
    }
    if (isRecord(value)) return matchRecord(query, value, options, nested);
  },
  // typed for generic records, so psyche's own code needs no casts
  matchRecord = <T extends Record<string, unknown>>(
    query: string,
    record: T,
    options: Pick<Partial<Options>, "fields" | "length" | "threshold">,
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

export { match, matchRecord, rank };
