import { fragmentOf, resolve } from "./href";
import type { AnyMatch as Matched, TextMatch } from "./matcher";

// the ranges of a match's text in the elements it's shown in, see rangesOf,
// are highlighted in a ::highlight(), see highlight
// matches are excerpts of sanitised text, with whitespace collapsed and quotes
// straightened, and the page's text puts no whitespace between block elements:
// texts are compared without whitespace and with straight quotes, then mapped
// back to the characters of the page's text nodes
const QUOTES: Record<string, string> = { "“": '"', "”": '"', "‘": "'", "’": "'" },
  SPACE = /\s/,
  normalise = (char: string) => QUOTES[char] ?? char,
  textNodes = ($root: Node) => {
    const tree = document.createTreeWalker($root, NodeFilter.SHOW_TEXT),
      nodes: Text[] = [];
    while (tree.nextNode()) nodes.push(tree.currentNode as Text);
    return nodes;
  };

// the first occurrence of a matched text within an element
const rangeOf = ($root: Node | null | undefined, text: string | undefined) => {
  if (!$root || !text) return;
  const needle = text
    .split("")
    .filter((char) => !SPACE.test(char))
    .map(normalise)
    .join("");
  if (!needle) return;
  let haystack = "";
  const at: [Text, number][] = [];
  for (const node of textNodes($root))
    for (let i = 0; i < node.data.length; i++) {
      if (SPACE.test(node.data[i])) continue;
      haystack += normalise(node.data[i]);
      at.push([node, i]);
    }
  const index = haystack.indexOf(needle);
  if (index === -1) return;
  const range = new Range(),
    end = at[index + needle.length - 1];
  range.setStart(...at[index]);
  range.setEnd(end[0], end[1] + 1);
  return range;
};

type Target = Element | null | undefined;
// a match's elements: one for a value, one per item for an array of values,
// and for a record's fields either each field's element(s), or the page they're on
type Targets = Target | readonly Target[] | { readonly [key: string]: Targets };
// a match: a text's, a record's, an array of them, or matches keyed by field,
// as a record's matches are
type AnyMatch = Matched | readonly AnyMatch[] | { readonly [key: string]: AnyMatch | undefined };

const isValue = (match: AnyMatch | undefined): match is TextMatch =>
    typeof (match as TextMatch | undefined)?.value === "string",
  isElement = (target: Targets): target is Element =>
    typeof Element !== "undefined" && target instanceof Element,
  // a range for a text's match, or none
  select = ($el: Target, text: string | undefined) => {
    const range = rangeOf($el, text);
    return range ? [range] : [];
  },
  // a record's fields' matches, or matches keyed by field
  fieldsOf = (match: object) =>
    Object.entries("matches" in match ? (match.matches as object) : match) as [
      string,
      AnyMatch | undefined,
    ][],
  // a record's fields' matches in the page they're on: values linking within
  // the page, from the record's link (or the record it's in's), in the element
  // they link to
  inPage = ($page: Element, match: object, base?: string, page?: string): Range[] => {
    const href = (match as { href?: string }).href;
    base = href ? resolve(href, base) : base;
    page ??= base;
    return fieldsOf(match).flatMap(([, value]) =>
      (Array.isArray(value) ? value : [value]).flatMap((item: AnyMatch | undefined) => {
        const id = fragmentOf((item as { href?: string } | undefined)?.href, base, page),
          $el = id ? $page.ownerDocument.getElementById(id) : undefined;
        if ($el) return isValue(item) ? select($el, item.match) : inPage($el, item!, base, page);
        if (Array.isArray(value) || !item) return [];
        return isValue(item) ? select($page, item.match) : inPage($page, item, base, page);
      }),
    );
  };

// the ranges of a match's text in the elements it's shown in, for a highlighter:
// - a text's match (or a field's) in its element
// - an array's matches (or an array field's) in each item's element, in the
//   array's order
// - a record's fields' matches in each field's element(s), keyed by field, or
//   in the page they're on (its link's): values linking within it (e.g.
//   headings, by #id) in the element they link to, and other single values in
//   the page's text. other array items (e.g. tags) aren't found in a page, so
//   are left to its components
const rangesOf = (target: Targets, match: AnyMatch | undefined): Range[] => {
  if (!match) return [];
  if (Array.isArray(match)) {
    const $items = Array.isArray(target) ? (target as readonly Targets[]) : [];
    return (match as readonly AnyMatch[]).flatMap((item, i) => rangesOf($items[i], item));
  }
  if (isValue(match)) {
    const $el = Array.isArray(target) ? (target as readonly Target[])[0] : (target as Target);
    return select($el, match.match);
  }
  if (Array.isArray(target) || !target) return [];
  if (isElement(target)) return inPage(target, match);
  const $fields = target as { readonly [key: string]: Targets };
  return fieldsOf(match).flatMap(([key, value]) => rangesOf($fields[key], value));
};

// a ::highlight(name), shared by everything that highlights in it (e.g. the
// search's results, the matched page and the site's own components): each
// adds its own ranges, and removes only those, so one never clears another's
const registry = (name: string) => {
  if (typeof CSS === "undefined" || !("highlights" in CSS)) return;
  let highlight = CSS.highlights.get(name);
  if (!highlight) CSS.highlights.set(name, (highlight = new Highlight()));
  return highlight;
};

// highlights ranges in a ::highlight(name), default: psyche, and returns their
// removal, which only removes them once, e.g. for an effect's cleanup
const highlight = (ranges: readonly Range[], name = "psyche") => {
  let added = [...ranges];
  for (const range of added) registry(name)?.add(range);
  return () => {
    for (const range of added) registry(name)?.delete(range);
    added = [];
  };
};

export { highlight, rangesOf };
