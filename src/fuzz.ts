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
      .replace(/[^\S\n]+/g, " "),
  ),
  searchitise = memo((str) =>
    sanitise(str)
      .replace(/\n/g, " ")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .toLowerCase(),
  );

const tail = (str: string, length: number) => {
    // trim from the beginning of a string
    if (length <= 0) return "";
    if (str.length <= length) return str;
    let trail = "...";
    if (length <= trail.length) trail = "";
    str = str.slice(str.length - (length - trail.length));
    const cut = str.search(/\s/);
    if (cut !== -1) str = str.slice(cut);
    return trail + str.replace(/^[.\s]+/, "");
  },
  head = (str: string, length: number) => {
    // trim from the end of a string
    if (length <= 0) return "";
    if (str.length <= length) return str;
    let trail = "...";
    if (length <= trail.length) trail = "";
    str = str.slice(0, length - trail.length);
    const cut = str.search(/\s\S*$/);
    if (cut !== -1) str = str.slice(0, cut + 1);
    return str.replace(/[.\s]+$/, "") + trail;
  },
  trim = (
    haystack: string,
    match?: [number, number],
    length = 192,
  ): { haystack: string; match?: string } => {
    haystack = sanitise(haystack);
    if (!match) return { haystack: head(haystack, length) };

    const needle = haystack.slice(match[0], match[1]);
    if (match[1] - match[0] >= length) {
      const haystack = head(needle, length);
      return { haystack, match: haystack.replace(/\.\.\.$/, "") };
    }

    const context = length - needle.length,
      // a one-line match also keeps the line after it
      eol = haystack.indexOf("\n", match[1]),
      next = eol >= 0 && !needle.includes("\n") ? haystack.indexOf("\n", eol + 1) : eol;
    let suffix = haystack.slice(match[1], next >= 0 ? next : undefined),
      prefix = haystack.slice(haystack.lastIndexOf("\n", match[0] - 1) + 1, match[0]);
    // up to 25% of a match's context is kept before the needle
    suffix = head(suffix, context - tail(prefix, context * 0.25).length);
    prefix = tail(prefix, context - suffix.length);
    return { haystack: prefix + needle + suffix, match: needle };
  };

const score = (needle: string, match: [number, number]) => needle.length / (match[1] - match[0]),
  fuzz = (needle: string, haystack: string, position: number) => {
    // find first instance of each character
    let end = position;
    for (let i = 0; i < needle.length; i++, end++) {
      end = haystack.indexOf(needle[i], end);
      if (end < 0) return;
    }
    // tighten to last instance of each character in range
    let start = end;
    for (let i = needle.length - 1; i >= 0; i--) start = haystack.lastIndexOf(needle[i], start - 1);
    return { score: score(needle, [start, end]), match: [start, end] as [number, number] };
  },
  find = (needle: string, haystack: string) => {
    if (!needle) return;
    let best = undefined;
    needle = searchitise(needle);
    haystack = searchitise(haystack);
    for (let i = 0; haystack.length - i >= needle.length;) {
      const next = fuzz(needle, haystack, i);
      if (!next) break;
      if (next.score === 1) return next;
      if (!best || next.score > best.score) best = next;
      i += (Math.floor((next.match[0] - i) / needle.length) + 1) * needle.length;
    }
    return best;
  };

export { find, trim };
