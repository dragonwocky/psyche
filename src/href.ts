// links within the index, resolved without a page: a linked value's is relative
// to its record's, and an entry's to the site. not public
import type { RecordMatch } from "./match";

const BASE = "psyche:/",
  url = (href: string, base = "") => new URL(href, new URL(base, BASE));

// kept relative to the site if both hrefs are
const resolve = (href: string, base = "") => {
    const resolved = url(href, base);
    return resolved.protocol === "psyche:"
      ? resolved.pathname + resolved.search + resolved.hash
      : resolved.href;
  },
  // the id a href links to by its fragment, if it's on page (default: base)
  fragmentOf = (href: string | undefined, base = "", page = base) => {
    if (!href) return;
    const resolved = url(href, base),
      on = url(page);
    return resolved.hash && resolved.origin === on.origin && resolved.pathname === on.pathname
      ? decodeURIComponent(resolved.hash.slice(1))
      : undefined;
  },
  // its best value's link, resolved against its own, or its own
  linkOf = (match: {
    href?: string;
    match?: RecordMatch["match"];
    matches: Record<string, unknown>;
  }) => {
    const { href = "", match: best, matches } = match,
      field = best && matches[best.key],
      value = (Array.isArray(field) ? field[best!.index!] : field) as { href?: string } | undefined;
    return value?.href ? resolve(value.href, href) : href;
  };

export { fragmentOf, linkOf, resolve };
