import type { FieldsMatch, ValueMatch } from "./match";

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
  isRange = (range: unknown): range is Range =>
    typeof Range !== "undefined" && range instanceof Range,
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

// a field's match within the element it's shown in, or each of an array field's
// matches within its item's element (e.g. each tag's), in the array's order
const highlightMatch = (
  target: Element | null | undefined | readonly (Element | null | undefined)[],
  match: ValueMatch | readonly ValueMatch[] | undefined,
): (Range | undefined)[] => {
  if (!match) return [];
  if (!Array.isArray(match)) {
    const $el = Array.isArray(target) ? target[0] : (target as Element | null | undefined);
    return [rangeOf($el, (match as ValueMatch).match)];
  }
  const $items = Array.isArray(target) ? target : [];
  return (match as readonly ValueMatch[]).map((item, i) =>
    item.match ? rangeOf($items[i], item.match) : undefined,
  );
};

// a record's match on its own page: a value with an id (e.g. a heading) within
// its element, and other single values within the page's text. array items
// without ids (e.g. tags) are left to the site's components, see page in createSearch
const highlightLocated = ($root: Element, match: FieldsMatch | undefined) => {
  const ranges: (Range | undefined)[] = [];
  for (const [key, value] of Object.entries((match ?? {}) as Record<string, unknown>)) {
    if (key === "score" || key === "best" || !value || typeof value !== "object") continue;
    for (const item of Array.isArray(value) ? (value as ValueMatch[]) : [value as ValueMatch]) {
      if (!item.match) continue;
      if (item.id) ranges.push(rangeOf($root.ownerDocument.getElementById(item.id), item.match));
      else if (!Array.isArray(value)) ranges.push(rangeOf($root, item.match));
    }
  }
  return ranges;
};

export { createHighlights, highlightLocated, highlightMatch, rangeOf };
