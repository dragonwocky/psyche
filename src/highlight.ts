import { type ItemMatch, RANKING, type Ranking } from "./match";

// every match is shown in a single ::highlight(name), shared by the search
// panel's results, the matched page and the site's own components. each keeps
// its own group of ranges and only ever replaces those, so one never clears
// another's (e.g. results clearing the page's)
const registry = (name: string) => {
    if (typeof CSS === "undefined" || !("highlights" in CSS)) return;
    let highlight = CSS.highlights.get(name);
    if (!highlight) CSS.highlights.set(name, (highlight = new Highlight()));
    return highlight;
  },
  isRange = (range: unknown): range is Range => range instanceof Range,
  createHighlights = (name = "psyche") => {
    let ranges: Range[] = [];
    return (next: unknown[]) => {
      const highlight = registry(name);
      for (const range of ranges) highlight?.delete(range);
      ranges = next.filter(isRange);
      for (const range of ranges) highlight?.add(range);
    };
  };

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

// a list's items (e.g. tags), each the nth element child of a container
const highlightItems = (
  $list: Element | null | undefined,
  items: (ItemMatch | string | undefined)[] = [],
) =>
  items.map((item, i) => {
    const match = typeof item === "string" ? item : item?.match;
    return match ? rangeOf($list?.children[i], match) : undefined;
  });

// each of a match's ranked fields within an element, as marked by [data-psyche]:
// text fields within their element, list fields as the items of their element
// (list fields sharing an element are its items in ranking order, e.g. authors
// then categories) and headings within their element or, on a page, by their id.
// with fallback, text fields without an element are found anywhere in the root
const highlightFields = (
  $root: Element,
  match: Record<string, unknown>,
  { ranking = RANKING as Ranking, fallback = false } = {},
) => {
  const ranges: (Range | undefined)[] = [],
    lists = new Map<string, ItemMatch[]>(),
    $field = (name: string) => $root.querySelector(`[data-psyche="${name}"]`);
  for (const field of ranking) {
    const name = field.element ?? field.key,
      value = match[field.key];
    if (field.type === "text") {
      const $el = $field(name) ?? (fallback ? $root : null);
      ranges.push(rangeOf($el, (value as { match?: string } | undefined)?.match));
    } else if (field.type === "list") {
      lists.set(name, [...(lists.get(name) ?? []), ...((value as ItemMatch[] | undefined) ?? [])]);
    } else {
      for (const heading of (value as { id: string; match?: string }[] | undefined) ?? []) {
        if (!heading.match) continue;
        const $el =
          $field(name) ?? (fallback ? $root.ownerDocument.getElementById(heading.id) : null);
        ranges.push(rangeOf($el, heading.match));
      }
    }
  }
  for (const [name, items] of lists) ranges.push(...highlightItems($field(name), items));
  return ranges;
};

export { createHighlights, highlightFields, highlightItems, rangeOf };
