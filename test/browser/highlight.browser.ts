import { createHighlights, highlightFields, highlightItems, rangeOf } from "../../src/highlight";
import { matchFields } from "../../src/match";
import { describe, expect, test } from "./harness";

const html = (markup: string) => {
  document.body.innerHTML = markup;
  return document.body.firstElementChild!;
};

describe("rangeOf", () => {
  test("finds text across element boundaries without whitespace between them", () => {
    const $root = html("<article><h2>Heading 2</h2><h3>Heading 3</h3></article>");
    expect(rangeOf($root, "Heading 2\nHeading 3")?.toString()).toBe("Heading 2Heading 3");
  });

  test("finds sanitised text in curly quotes and runs of whitespace", () => {
    const $root = html("<p>She said “hello   there”.</p>");
    expect(rangeOf($root, '"hello there"')?.toString()).toBe("“hello   there”");
  });

  test("finds text split across text nodes", () => {
    const $root = html("<p>Plant <strong>winter</strong> garlic</p>");
    expect(rangeOf($root, "winter garlic")?.toString()).toBe("winter garlic");
  });

  test("returns nothing for a missing element, text or match", () => {
    expect(rangeOf(null, "x")).toBeUndefined();
    expect(rangeOf(html("<p>abc</p>"), "")).toBeUndefined();
    expect(rangeOf(html("<p>abc</p>"), "xyz")).toBeUndefined();
  });
});

describe("highlightItems", () => {
  test("highlights each child by its item's match", () => {
    const $tags = html("<div><span>Alice</span><span>Gardening</span></div>"),
      ranges = highlightItems($tags, [{ text: "Alice" }, { text: "Gardening", match: "Garden" }]);
    expect(ranges.map((range) => range?.toString())).toEqual([undefined, "Garden"]);
  });
});

describe("highlightFields", () => {
  const record = {
    href: "/",
    title: "Winter garden",
    body: "Garlic and kale",
    authors: ["Alice"],
    categories: ["Gardening"],
    headings: [{ id: "kale", text: "Growing kale" }],
  };
  const card = () =>
    html(`<a>
      <h2 data-psyche="title">Winter garden</h2>
      <p data-psyche="body">Garlic and kale</p>
      <div data-psyche="tags"><span>Alice</span><span>Gardening</span></div>
    </a>`);
  const found = (query: string) =>
    highlightFields(card(), matchFields(query, record))
      .filter((range) => range)
      .map((range) => [range!.toString(), range!.startContainer.parentElement!.tagName]);

  test("highlights the best field in its element", () => {
    expect(found("winter")).toEqual([["Winter", "H2"]]);
    expect(found("garlic")).toEqual([["Garlic", "P"]]);
  });

  test("highlights list fields sharing an element as its items, in ranking order", () => {
    expect(found("gardening")).toEqual([["Gardening", "SPAN"]]);
    expect(found("alice")).toEqual([["Alice", "SPAN"]]);
  });

  test("finds text fields and headings anywhere in the root with fallback", () => {
    const $page = html(`<article><h1>Winter garden</h1><h2 id="kale">Growing kale</h2></article>`),
      match = matchFields("growing kale", record);
    expect(highlightFields($page, match).filter((range) => range).length).toBe(0);
    const [range] = highlightFields($page, match, { fallback: true }).filter((range) => range);
    expect(range?.toString()).toBe("Growing kale");
    expect(range?.startContainer.parentElement?.id).toBe("kale");
  });
});

describe("createHighlights", () => {
  test("replaces only its own group of ranges in the shared highlight", () => {
    CSS.highlights.clear();
    const $p = html("<p>one two</p>"),
      a = createHighlights(),
      b = createHighlights();
    a([rangeOf($p, "one"), undefined]);
    b([rangeOf($p, "two")]);
    expect(CSS.highlights.get("psyche")?.size).toBe(2);
    a([]);
    expect([...CSS.highlights.get("psyche")!].map(String)).toEqual(["two"]);
  });

  test("uses its own highlight name", () => {
    createHighlights("other")([rangeOf(html("<p>x</p>"), "x")]);
    expect(CSS.highlights.get("other")?.size).toBe(1);
  });
});
