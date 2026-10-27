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

// a field's value: text, or text with the id of the element it's shown in on
// its page (e.g. a heading), which a match in it links to. a field is either
// value or an array of them (e.g. tags, or a page's headings)
type Value = string | { value: string; id: string };
type Shape = Value | Value[];

// a value's match: an excerpt of its text (an array's items are kept whole)
type ValueMatch = { text: string; match?: string; id?: string };
type FieldMatch<V> = V extends readonly unknown[] ? ValueMatch[] : ValueMatch;

// the fields matched against a query, of any name: each value's score is its
// match's plus its field's tier, so e.g. a title (tier 3) outranks a body (tier 1)
type Field<K extends string = string> = { key: K; tier: number };
type Fields = readonly Field[];

// an entry of a site's search index, generated by the site: only href is
// required, other values are searched as the site's fields list them
type PsycheRecord = { href: string } & Record<string, unknown>;

// the keys of a record whose values are fields' shapes (href is its link)
type FieldKey<T> = Exclude<
  { [K in keyof T]-?: NonNullable<T[K]> extends Shape ? K & string : never }[keyof T],
  "href"
>;
// a record's fields, or any fields for records without a known shape
type FieldsOf<T> = [FieldKey<T>] extends [never] ? Fields : readonly Field<FieldKey<T>>[];

// each field's match (none for a record without the field), and the best match:
// its field, and its item for an array field
type FieldsMatch<T = PsycheRecord> = {
  [K in FieldKey<T>]?: FieldMatch<NonNullable<T[K]>>;
} & { score: number; best?: { key: string; index?: number } };

const textOf = (value: unknown) =>
    typeof value === "string"
      ? value
      : typeof value === "object"
          && value
          && typeof (value as { value?: unknown }).value === "string"
        ? (value as { value: string }).value
        : undefined,
  idOf = (value: unknown) =>
    typeof value === "object" && value && typeof (value as { id?: unknown }).id === "string"
      ? (value as { id: string }).id
      : undefined;

// matches a query against each of a record's fields (and each item of its
// array fields), keeping only the best scoring value's match (0 for none)
const matchFields = <T extends object = PsycheRecord>(
  query: string,
  record: T,
  // a list shared by records of other shapes may name fields this one lacks
  fields: Fields,
): FieldsMatch<T> => {
  const texts: string[] = [],
    tiers: number[] = [],
    entries = fields.map((field) => {
      const value = (record as Record<string, unknown>)[field.key],
        items = (Array.isArray(value) ? value : [value]).filter(
          (item) => textOf(item) !== undefined,
        ),
        offset = texts.length;
      for (const item of items) {
        texts.push(textOf(item)!);
        tiers.push(field.tier);
      }
      return { field, value, items, offset };
    });
  const fuzzed = texts.map((text) => fuzz(query, text)),
    scores = fuzzed.map(([fscore], i) => (fscore ? fscore + tiers[i] : 0)),
    score = Math.max(0, ...scores),
    best = score ? scores.indexOf(score) : -1,
    matches = fuzzed.map((match, i): [number, number, number] => (i === best ? match : NO_MATCH));
  const result: Record<string, unknown> = { score };
  for (const { field, value, items, offset } of entries) {
    const id = (item: unknown) => (idOf(item) ? { id: idOf(item) } : {});
    if (Array.isArray(value)) {
      result[field.key] = items.map((item, i) => ({
        text: texts[offset + i],
        match: balance(matches[offset + i], texts[offset + i]).match,
        ...id(item),
      }));
      if (best >= offset && best < offset + items.length)
        result.best = { key: field.key, index: best - offset };
    } else if (items.length) {
      result[field.key] = { ...balance(matches[offset], texts[offset]), ...id(value) };
      if (best === offset) result.best = { key: field.key };
    }
  }
  return result as FieldsMatch<T>;
};

// matches a query against each value separately, so every matching value keeps its match
const matchValues = (query: string, values: readonly Value[] = []): ValueMatch[] =>
  values.map((value) => {
    const text = textOf(value) ?? "",
      id = idOf(value);
    return { text, match: balance(fuzz(query, text), text).match, ...(id ? { id } : {}) };
  });

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
  type Field,
  type FieldKey,
  type FieldMatch,
  type Fields,
  type FieldsMatch,
  type FieldsOf,
  fuzz,
  match,
  matchFields,
  matchValues,
  MAX_RESULTS,
  type PsycheRecord,
  rank,
  sanitise,
  type Shape,
  type Value,
  type ValueMatch,
};
