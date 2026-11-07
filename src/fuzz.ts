// fuzzy matching of a query against page text, returning the best match
// and an excerpt of the text around it. psyche's match and rank are built
// on these, which aren't part of the public api
type Excerpt = { text: string; match?: string };

// how texts are matched and excerpted, by psyche's match and rank and the worker
type MatchOptions = {
  // the most characters an excerpt keeps of a text, default: 192
  excerpt?: number;
  // the share of an excerpt's context kept before its match, default: 0.25
  lead?: number;
  // the least share of a match's span its query's characters fill, below
  // which it doesn't match, from 0 to 1, default: 0.4
  threshold?: number;
};

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

const NO_MATCH: [number, number, number] = [0, -1, -1],
  searchitise = memo((str) => sanitise(str).replace(/\n+/g, " ").toLocaleLowerCase()),
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
  fuzz = (needle: string, haystack: string, threshold = 0.4): [number, number, number] => {
    if (!needle) return NO_MATCH;
    needle = searchitise(needle);
    haystack = searchitise(haystack);
    let best = NO_MATCH;
    for (let i = 0; haystack.length - i >= needle.length;) {
      const found = find(needle, haystack, i);
      if (!found) break;
      if (found.match[0] > threshold && found.match[0] > best[0]) best = found.match;
      if (best[0] === 1) break;
      i += (Math.floor((found.first - i) / needle.length) + 1) * needle.length;
    }
    return best;
  },
  // texts are cut to twice the excerpt's length before they're trimmed word by
  // word, which is the same excerpt (the cut word is the first trimmed) sooner
  head = (str: string, length: number) =>
    str.length > length * 2 ? str.slice(0, length * 2) : str,
  tail = (str: string, length: number) => (str.length > length * 2 ? str.slice(-length * 2) : str),
  balance = (
    [fscore, f0, f1]: [number, number, number],
    haystack: string,
    { excerpt = 192, lead = 0.25 }: MatchOptions = {},
  ): Excerpt => {
    haystack = sanitise(haystack);
    if (!fscore) {
      let h = head(haystack, excerpt);
      while (h.length > excerpt) h = trimEnd(h);
      return { text: h };
    } else if (f1 > f0 + excerpt) {
      let h = head(haystack.slice(f0, f1), excerpt);
      while (h.length > excerpt) h = trimEnd(h);
      return { text: h, match: h.replace(/\.\.\.$/, "") };
    } else {
      let h0 = haystack.slice(0, f0),
        h1 = haystack.slice(f1),
        line1 = h1.indexOf("\n");
      const h = haystack.slice(f0, f1),
        line0 = h0.lastIndexOf("\n"),
        context = excerpt - h.length,
        context0 = context * lead,
        context1 = context - context0;
      if (line1 > 0 && !h.includes("\n")) line1 = h1.indexOf("\n", line1 + 1);
      if (line1 > 0) h1 = h1.slice(0, line1);
      if (line0 > 0) h0 = h0.slice(line0 + 1);
      h0 = tail(h0, excerpt);
      h1 = head(h1, excerpt);
      while (h0.length > context0) h0 = trimStart(h0);
      while (h1.length > context1) h1 = trimEnd(h1);
      return { text: h0 + h + h1, match: h };
    }
  };

export { balance, type Excerpt, fuzz, type MatchOptions, sanitise };
