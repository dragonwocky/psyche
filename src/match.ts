// fuzzy matching of a query against page text, returning the best match
// and an excerpt of the text around it
type Excerpt = { text: string; match?: string };

// a function's results by its argument, as the same texts (an index's)
// are matched and excerpted on every keystroke
const memo = (fn: (str: string) => string) => {
    const cache = new Map<string, string>();
    return (str = "") => {
      let result = cache.get(str);
      if (result === undefined) cache.set(str, (result = fn(str)));
      return result;
    };
  },
  sanitise = memo((str) =>
    str
      .trim()
      .replace(/\n+/g, "\n")
      .replace(/[^\S\n]+/g, " ")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'"),
  ),
  trimStart = (str = "") => {
    if (str.startsWith("...")) str = str.slice(3);
    let i = 0;
    while (i < str.length && /[^\s]/.test(str[i])) i++;
    str = str.slice(i).trimStart();
    return str ? "..." + str : "";
  },
  trimEnd = (str = "") => {
    if (str.endsWith("...")) str = str.slice(0, -3);
    let i = str.length - 1;
    while (i > 0 && /[^\s]/.test(str[i])) i--;
    str = str.slice(0, i).trimEnd();
    return str ? str + "..." : "";
  };

const MAX_RESULTS = 6,
  EXCERPT_LENGTH = 192,
  PRE_EXCERPT_LENGTH = 0.25,
  FUZZ_THRESHOLD = 0.3,
  searchitise = memo((str) => sanitise(str).replace(/\n+/g, " ").toLocaleLowerCase()),
  NO_MATCH: [number, number, number] = [0, -1, -1],
  // the needle's characters in order in the haystack from an offset: the first
  // match found forwards, tightened to its latest start found backwards from its
  // end, and where the forward match began
  find = (needle: string, haystack: string, from: number) => {
    let end = from,
      first = -1;
    for (let i = 0; i < needle.length; i++, end++) {
      end = haystack.indexOf(needle[i], end);
      if (end < 0) return;
      if (!i) first = end;
    }
    let start = end;
    for (let i = needle.length - 1; i >= 0; i--) start = haystack.lastIndexOf(needle[i], start - 1);
    return {
      match: [needle.length / (end - start), start, end] as [number, number, number],
      first,
    };
  },
  // the best match of a window of the haystack, trying from each needle
  // length along it until a whole match or none at all. windows starting
  // at or before a forward match's first character find the same match,
  // so are skipped
  fuzz = (needle: string, haystack: string): [number, number, number] => {
    if (!needle) return NO_MATCH;
    needle = searchitise(needle);
    haystack = searchitise(haystack);
    let best = NO_MATCH;
    for (let i = 0; haystack.length - i >= needle.length;) {
      const found = find(needle, haystack, i);
      if (!found) break;
      if (found.match[0] > FUZZ_THRESHOLD && found.match[0] > best[0]) best = found.match;
      if (best[0] === 1) break;
      i += (Math.floor((found.first - i) / needle.length) + 1) * needle.length;
    }
    return best;
  },
  // texts are cut to twice the excerpt's length before they're trimmed word by
  // word, which is the same excerpt (the cut word is the first trimmed) sooner
  head = (str: string) =>
    str.length > EXCERPT_LENGTH * 2 ? str.slice(0, EXCERPT_LENGTH * 2) : str,
  tail = (str: string) => (str.length > EXCERPT_LENGTH * 2 ? str.slice(-EXCERPT_LENGTH * 2) : str),
  balance = ([fscore, f0, f1]: [number, number, number], haystack: string): Excerpt => {
    haystack = sanitise(haystack);
    if (!fscore) {
      let h = head(haystack);
      while (h.length > EXCERPT_LENGTH) h = trimEnd(h);
      return { text: h };
    } else if (f1 > f0 + EXCERPT_LENGTH) {
      let h = head(haystack.slice(f0, f1));
      while (h.length > EXCERPT_LENGTH) h = trimEnd(h);
      return { text: h, match: h.replace(/\.\.\.$/, "") };
    } else {
      let h0 = haystack.slice(0, f0),
        h1 = haystack.slice(f1),
        line1 = h1.indexOf("\n");
      const h = haystack.slice(f0, f1),
        line0 = h0.lastIndexOf("\n"),
        context = EXCERPT_LENGTH - h.length,
        context0 = context * PRE_EXCERPT_LENGTH,
        context1 = context - context0;
      if (line1 > 0 && !h.includes("\n")) line1 = h1.indexOf("\n", line1 + 1);
      if (line1 > 0) h1 = h1.slice(0, line1);
      if (line0 > 0) h0 = h0.slice(line0 + 1);
      h0 = tail(h0);
      h1 = head(h1);
      while (h0.length > context0) h0 = trimStart(h0);
      while (h1.length > context1) h1 = trimEnd(h1);
      return { text: h0 + h + h1, match: h };
    }
  };

// a query's best match in a text, with an excerpt of the text around it
const match = (query: string, text = "") => {
  const fuzzed = fuzz(query, text);
  return { ...balance(fuzzed, text), score: fuzzed[0] };
};

type ItemMatch = { text: string; match?: string };
type Heading = { id: string; text: string };
type HeadingMatch = Heading & { match?: string };

// the fields matched against a query, in order of priority: each field's score
// is its match's plus its tier, so a title match outranks any body match
type RankedField = {
  key: string;
  tier: number;
  // list fields render as tags, headings link to their id on the page
  type: "text" | "list" | "headings";
  // the [data-psyche] element a match is highlighted in, see highlightFields
  element?: string;
};
type Ranking = readonly RankedField[];

const RANKING = [
  { key: "title", tier: 3, type: "text" },
  { key: "headings", tier: 2.5, type: "headings" },
  { key: "authors", tier: 2, type: "list", element: "tags" },
  { key: "categories", tier: 2, type: "list", element: "tags" },
  { key: "body", tier: 1, type: "text" },
] as const satisfies Ranking;

type FieldValue<F extends RankedField> = F["type"] extends "text"
  ? string
  : F["type"] extends "list"
    ? string[]
    : Heading[];
type FieldMatch<F extends RankedField> = F["type"] extends "text"
  ? Excerpt
  : F["type"] extends "list"
    ? ItemMatch[]
    : HeadingMatch[];

// an entry of a site's search index, generated by the site: href, title and
// body are required, other fields are searched as listed in the ranking
type PsycheRecord<Meta = unknown, R extends Ranking = typeof RANKING> = {
  [F in R[number] as F["key"]]?: FieldValue<F>;
} & {
  href: string;
  title: string;
  body: string;
  // shown beside a result, not searched
  date?: string;
  // the group a result is listed under
  section?: string;
  // the site's own data, passed to its locate and href hooks untouched
  meta?: Meta;
};

type FieldsMatch<R extends Ranking = typeof RANKING> = {
  [F in R[number] as F["key"]]: FieldMatch<F>;
} & { score: number };

// matches a query against each of a record's ranked fields (and each item of
// its list fields), keeping only the best scoring field's match (0 for none)
const matchFields = <R extends Ranking = typeof RANKING>(
  query: string,
  record: Record<string, unknown>,
  ranking: R = RANKING as unknown as R,
): FieldsMatch<R> => {
  const texts: string[] = [],
    tiers: number[] = [],
    fields = ranking.map((field) => {
      const value = record[field.key],
        items =
          field.type === "text"
            ? [typeof value === "string" ? value : ""]
            : Array.isArray(value)
              ? value
              : [],
        offset = texts.length;
      for (const item of items) {
        texts.push(field.type === "headings" ? (item as Heading).text : (item as string));
        tiers.push(field.tier);
      }
      return { field, items, offset };
    });
  const fuzzed = texts.map((text) => fuzz(query, text)),
    scores = fuzzed.map(([fscore], i) => (fscore ? fscore + tiers[i] : 0)),
    score = Math.max(0, ...scores),
    best = score ? scores.indexOf(score) : -1,
    matches = fuzzed.map((match, i): [number, number, number] => (i === best ? match : NO_MATCH));
  const result: Record<string, unknown> = { score };
  for (const { field, items, offset } of fields) {
    if (field.type === "text") result[field.key] = balance(matches[offset], texts[offset]);
    else
      result[field.key] = items.map((item, i) => {
        const text = texts[offset + i],
          { match } = balance(matches[offset + i], text);
        return field.type === "headings"
          ? { ...(item as Heading), match }
          : ({ text, match } satisfies ItemMatch);
      });
  }
  return result as FieldsMatch<R>;
};

// matches a query against each text separately, so every matching text keeps its match
const matchItems = (query: string, texts: string[] = []): ItemMatch[] =>
  texts.map((text) => ({ text, match: balance(fuzz(query, text), text).match }));

// items fuzzy matched by their text, best matches first, or every item for no query
const rank = <T>(query: string, items: T[], text: (item: T) => string) =>
  !query.trim()
    ? items
    : items
        .map((item) => ({ item, score: fuzz(query, text(item))[0] }))
        .filter(({ score }) => score)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);

export {
  balance,
  type Excerpt,
  type FieldsMatch,
  fuzz,
  type Heading,
  type HeadingMatch,
  type ItemMatch,
  match,
  matchFields,
  matchItems,
  MAX_RESULTS,
  type PsycheRecord,
  rank,
  type RankedField,
  RANKING,
  type Ranking,
  sanitise,
};
