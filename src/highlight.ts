import { fragmentOf, resolve } from "./href";
import type { Match } from "./match";

type Target = Element | null | undefined;
// a match's elements, shaped as it is: per value, array item or field, or a page
type Targets = Target | readonly Target[] | { readonly [key: string]: Targets };
// a match, an array's, or matches keyed by field
type Matched =
  | Match
  | readonly Match[]
  | { readonly [key: string]: Match | readonly Match[] | undefined };

// matches are excerpts of sanitised text, and a page's text has no whitespace
// between blocks: texts are compared without whitespace, with straight quotes
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

const isValue = (match: Matched | undefined): match is Match<string> =>
    typeof (match as Match<string> | undefined)?.value === "string",
  isElement = (target: Targets): target is Element =>
    typeof Element !== "undefined" && target instanceof Element,
  select = ($el: Target, text: string | undefined) => {
    const range = rangeOf($el, text);
    return range ? [range] : [];
  },
  // a record's matches, or matches keyed by field
  fieldsOf = (match: object) =>
    Object.entries("matches" in match ? (match.matches as object) : match) as [
      string,
      Matched | undefined,
    ][],
  // values linking within the page (e.g. #frost) are found in the element they link to
  inPage = ($page: Element, match: object, base?: string, page?: string): Range[] => {
    const href = (match as { href?: string }).href;
    base = href ? resolve(href, base) : base;
    page ??= base;
    return fieldsOf(match).flatMap(([, value]) =>
      (Array.isArray(value) ? value : [value]).flatMap((item: Matched | undefined) => {
        const id = fragmentOf((item as { href?: string } | undefined)?.href, base, page),
          $el = id ? $page.ownerDocument.getElementById(id) : undefined;
        if ($el) return isValue(item) ? select($el, item.match) : inPage($el, item!, base, page);
        if (Array.isArray(value) || !item) return [];
        return isValue(item) ? select($page, item.match) : inPage($page, item, base, page);
      }),
    );
  };

// the ranges of a match's texts in the elements they're shown in, see Targets
const rangesOf = (target: Targets, match: Matched | undefined): Range[] => {
  if (!match) return [];
  if (Array.isArray(match)) {
    const $items = Array.isArray(target) ? (target as readonly Targets[]) : [];
    return (match as readonly Matched[]).flatMap((item, i) => rangesOf($items[i], item));
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

// shared by everything highlighting in name, each removing only its own ranges
const registry = (name: string) => {
  if (typeof CSS === "undefined" || !("highlights" in CSS)) return;
  let highlight = CSS.highlights.get(name);
  if (!highlight) CSS.highlights.set(name, (highlight = new Highlight()));
  return highlight;
};

// returns their removal, which removes only these ranges, once
const highlight = (ranges: readonly Range[], name = "psyche") => {
  let added = [...ranges];
  for (const range of added) registry(name)?.add(range);
  return () => {
    for (const range of added) registry(name)?.delete(range);
    added = [];
  };
};

// an element without a box (e.g. display: contents) can't be scrolled into view
const boxOf = (node: Node | undefined) => {
  let $el = node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentElement;
  while ($el && !$el.getClientRects().length) $el = $el.parentElement;
  return $el;
};

// scrolls to the match, and highlights it again as hydration re-renders its text,
// which collapses its ranges. returns its removal
const highlightPage = ($root: Element, match: Matched | undefined, name = "psyche") => {
  let ranges = rangesOf($root, match),
    remove = highlight(ranges, name);
  boxOf(ranges[0]?.commonAncestorContainer)?.scrollIntoView();
  const observer = new MutationObserver(() => {
    if (!ranges.some((range) => range.collapsed)) return;
    remove();
    ranges = rangesOf($root, match);
    remove = highlight(ranges, name);
  });
  observer.observe($root, { childList: true, subtree: true, characterData: true });
  return () => {
    observer.disconnect();
    remove();
  };
};

// centres the first of name's ranges in the page's order, of those with a box: the
// registry holds every component's, e.g. the results' in a closed dialog, which
// have none. returns whether there was one, for the site to fall back
// shortcut: scrolls the window, not a scrolling element the range is within
const scrollToHighlight = (name = "psyche", behavior: ScrollBehavior = "smooth") => {
  const [first] = [...((typeof CSS !== "undefined" && CSS.highlights?.get(name)) || [])]
    .filter((range): range is Range => range instanceof Range && !!range.getClientRects().length)
    .sort((a, b) => a.compareBoundaryPoints(Range.START_TO_START, b));
  if (!first) return false;
  const { top, height } = first.getBoundingClientRect();
  scrollBy({ top: top + height / 2 - innerHeight / 2, behavior });
  return true;
};

export { highlight, highlightPage, rangesOf, scrollToHighlight };
