// links within the index, which are resolved without a page: a linked value's
// href is relative to the link of the record it's in, and an index entry's to
// the site. not part of the public api
const BASE = "psyche:/",
  url = (href: string, base = "") => new URL(href, new URL(base, BASE));

// an href resolved against another, kept relative to the site if both are
const resolve = (href: string, base = "") => {
    const resolved = url(href, base);
    return resolved.protocol === "psyche:"
      ? resolved.pathname + resolved.search + resolved.hash
      : resolved.href;
  },
  // the id of the element an href, relative to base, links to on the page
  // (default: base), by its fragment
  fragmentOf = (href: string | undefined, base = "", page = base) => {
    if (!href) return;
    const resolved = url(href, base),
      on = url(page);
    return resolved.hash && resolved.origin === on.origin && resolved.pathname === on.pathname
      ? decodeURIComponent(resolved.hash.slice(1))
      : undefined;
  },
  // a record's match's link: its best value's, resolved against its own, or its own
  linkOf = (match: {
    href?: string;
    match?: { key: string; index?: number };
    matches: Record<string, unknown>;
  }) => {
    const { href = "", match: best, matches } = match,
      field = best && matches[best.key],
      value = (Array.isArray(field) ? field[best!.index!] : field) as { href?: string } | undefined;
    return value?.href ? resolve(value.href, href) : href;
  };

export { fragmentOf, linkOf, resolve };
