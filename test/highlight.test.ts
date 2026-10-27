// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createHighlights, highlightFields, highlightItems, rangeOf } from "../src/highlight";
import { matchFields } from "../src/match";

// jsdom has Range but not the CSS Custom Highlight API
class Highlight extends Set<Range> {}
const highlights = new Map<string, Highlight>();
vi.stubGlobal("Highlight", Highlight);
vi.stubGlobal("CSS", { highlights });

const html = (markup: string) => {
  document.body.innerHTML = markup;
  return document.body.firstElementChild!;
};

beforeEach(() => highlights.clear());

describe("rangeOf", () => {
  it("finds text across element boundaries without whitespace between them", () => {
    const $root = html("<article><h2>Heading 2</h2><h3>Heading 3</h3></article>");
    expect(rangeOf($root, "Heading 2\nHeading 3")?.toString()).toBe("Heading 2Heading 3");
  });

  it("finds sanitised text in curly quotes and runs of whitespace", () => {
    const $root = html("<p>She said “hello   there”.</p>");
    expect(rangeOf($root, '"hello there"')?.toString()).toBe("“hello   there”");
  });

  it("finds text split across text nodes", () => {
    const $root = html("<p>Plant <strong>winter</strong> garlic</p>");
    expect(rangeOf($root, "winter garlic")?.toString()).toBe("winter garlic");
  });

  it("returns nothing for a missing element, text or match", () => {
    expect(rangeOf(null, "x")).toBeUndefined();
    expect(rangeOf(html("<p>abc</p>"), "")).toBeUndefined();
    expect(rangeOf(html("<p>abc</p>"), "xyz")).toBeUndefined();
  });
});

describe("highlightItems", () => {
  it("highlights each child by its item's match", () => {
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

  it("highlights the best field in its element", () => {
    const text = (query: string) =>
      highlightFields(card(), matchFields(query, record))
        .filter((range) => range)
        .map((range) => [range!.toString(), range!.startContainer.parentElement!.tagName]);
    expect(text("winter")).toEqual([["Winter", "H2"]]);
    expect(text("garlic")).toEqual([["Garlic", "P"]]);
    // tags share an element, authors then categories
    expect(text("gardening")).toEqual([["Gardening", "SPAN"]]);
  });

  it("finds text fields and headings anywhere in the root with fallback", () => {
    const $page = html(`<article><h1>Winter garden</h1><h2 id="kale">Growing kale</h2></article>`),
      match = matchFields("growing kale", record);
    expect(highlightFields($page, match).filter((range) => range)).toEqual([]);
    const [range] = highlightFields($page, match, { fallback: true }).filter((range) => range);
    expect(range?.toString()).toBe("Growing kale");
    expect(range?.startContainer.parentElement?.id).toBe("kale");
  });
});

describe("createHighlights", () => {
  it("replaces only its own group of ranges", () => {
    const $p = html("<p>one two</p>"),
      a = createHighlights(),
      b = createHighlights();
    a([rangeOf($p, "one"), undefined]);
    b([rangeOf($p, "two")]);
    expect(highlights.get("psyche")?.size).toBe(2);
    a([]);
    expect([...highlights.get("psyche")!].map(String)).toEqual(["two"]);
  });

  it("does nothing without the highlight api", () => {
    vi.stubGlobal("CSS", {});
    expect(() => createHighlights()([rangeOf(html("<p>x</p>"), "x")])).not.toThrow();
    vi.stubGlobal("CSS", { highlights });
  });
});
