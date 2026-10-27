import { createHighlights, highlightLocated, highlightMatch, rangeOf } from "../../src/highlight";
import { matchFields } from "../../src/match";
import { FIELDS } from "./fixture";
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

describe("highlightMatch", () => {
  test("highlights a field's match in its element", () => {
    const $title = html("<h2>Winter garden</h2>");
    expect(highlightMatch($title, { text: "Winter garden", match: "garden" })[0]?.toString()).toBe(
      "garden",
    );
    expect(highlightMatch($title, { text: "Winter garden" })[0]).toBeUndefined();
    expect(highlightMatch($title, undefined).length).toBe(0);
  });

  test("highlights an array field's matches in each item's element", () => {
    const $tags = html("<div><span>Alice</span><span>Gardening</span></div>"),
      ranges = highlightMatch(
        [...$tags.children],
        [{ text: "Alice" }, { text: "Gardening", match: "Garden" }],
      );
    expect(ranges.map((range) => range?.toString())).toEqual([undefined, "Garden"]);
  });
});

describe("highlightLocated", () => {
  const record = {
    href: "/",
    title: "Winter garden",
    body: "Garlic and kale",
    authors: ["Alice"],
    headings: [{ value: "Growing kale", id: "kale" }],
  };
  const found = ($page: Element, query: string) =>
    highlightLocated($page, matchFields(query, record, FIELDS))
      .filter((range) => range)
      .map((range) => [range!.toString(), range!.startContainer.parentElement!.tagName]);

  test("finds a value with an id in its element, and other values in the page's text", () => {
    const $page = html(`<article><h1>Winter garden</h1><h2 id="kale">Growing kale</h2></article>`);
    expect(found($page, "growing kale")).toEqual([["Growing kale", "H2"]]);
    expect(found($page, "winter")).toEqual([["Winter", "H1"]]);
  });

  test("leaves array items without ids to the site, e.g. tags", () => {
    const $page = html(`<article><h1>Winter garden</h1><span>Alice</span></article>`);
    expect(found($page, "alice")).toEqual([]);
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
