import { highlight, highlightPage, rangesOf, scrollToHighlight } from "../../src/highlight";
import { match } from "../../src/match";
import { FIELDS } from "./fixture";
import { describe, expect, test } from "./harness";

const html = (markup: string) => {
    document.body.innerHTML = markup;
    return document.body.firstElementChild!;
  },
  // a value's match of a text, as match returns it
  value = (text: string) => ({ value: text, match: text, score: 1 });

describe("rangesOf a value's match", () => {
  test("finds text across element boundaries without whitespace between them", () => {
    const $root = html("<article><h2>Heading 2</h2><h3>Heading 3</h3></article>");
    expect(rangesOf($root, value("Heading 2\nHeading 3")).map(String)).toEqual([
      "Heading 2Heading 3",
    ]);
  });

  test("finds sanitised text in curly quotes and runs of whitespace", () => {
    const $root = html("<p>She said “hello   there”.</p>");
    expect(rangesOf($root, value('"hello there"')).map(String)).toEqual(["“hello   there”"]);
  });

  test("finds text split across text nodes", () => {
    const $root = html("<p>Plant <strong>winter</strong> garlic</p>");
    expect(rangesOf($root, value("winter garlic")).map(String)).toEqual(["winter garlic"]);
  });

  test("finds match's match in its element, and nothing without one", () => {
    const $title = html("<h2>Winter garden</h2>");
    expect(rangesOf($title, match("garden", "Winter garden")).map(String)).toEqual(["garden"]);
    expect(rangesOf($title, match("zzz", "Winter garden"))).toEqual([]);
    expect(rangesOf($title, undefined)).toEqual([]);
    expect(rangesOf(null, value("x"))).toEqual([]);
    expect(rangesOf(html("<p>abc</p>"), value("xyz"))).toEqual([]);
  });
});

describe("rangesOf values' matches", () => {
  test("finds each item's match in its own element", () => {
    const $tags = html("<div><span>Alice</span><span>Gardening</span></div>");
    expect(
      rangesOf([...$tags.children], match("garden", ["Alice", "Gardening"])).map(String),
    ).toEqual(["Garden"]);
  });
});

describe("rangesOf a record's match", () => {
  const record = {
    href: "/",
    title: "Winter garden",
    body: "Garlic and kale",
    authors: ["Alice"],
    headings: [{ value: "Growing kale", href: "#kale" }],
  };
  const found = ($target: Parameters<typeof rangesOf>[0], query: string) =>
    rangesOf($target, match(query, record, { fields: FIELDS })).map((range) => [
      range.toString(),
      range.startContainer.parentElement!.tagName,
    ]);

  test("finds each field's match in its own element(s)", () => {
    const $card = html(`<div><h3>Winter garden</h3><span>Alice</span></div>`),
      $fields = { title: $card.children[0], authors: [$card.children[1]] };
    expect(found($fields, "winter")).toEqual([["Winter", "H3"]]);
    expect(found($fields, "alice")).toEqual([["Alice", "SPAN"]]);
  });

  test("finds a value linking within its page in that element, and others in the page's text", () => {
    const $page = html(`<article><h1>Winter garden</h1><h2 id="kale">Growing kale</h2></article>`);
    expect(found($page, "growing kale")).toEqual([["Growing kale", "H2"]]);
    expect(found($page, "winter")).toEqual([["Winter", "H1"]]);
  });

  test("leaves a page's other array items to its components, e.g. tags", () => {
    const $page = html(`<article><h1>Winter garden</h1><span>Alice</span></article>`);
    expect(found($page, "alice")).toEqual([]);
  });

  test("finds a record's records' fields, in their elements or the page", () => {
    const fields = [...FIELDS, { key: "name", tier: 0 }],
      author = (value: string) => ({
        ...record,
        authors: [{ value: { name: value }, href: "#author" }],
      });
    const $page = html(`<article><p id="author">By Alice</p></article>`);
    expect(rangesOf($page, match("alice", author("Alice"), { fields })).map(String)).toEqual([
      "Alice",
    ]);
    const $card = html(`<div><span>Alice</span></div>`);
    expect(
      rangesOf({ authors: [$card.children[0]] }, match("alice", author("Alice"), { fields })).map(
        String,
      ),
    ).toEqual(["Alice"]);
  });

  test("leaves values linking to other pages to the page's text", () => {
    const $page = html(`<article><h2 id="kale">Growing kale</h2></article>`),
      elsewhere = {
        ...record,
        href: "/garden",
        headings: [{ value: "Growing kale", href: "/kale#kale" }],
      };
    expect(rangesOf($page, match("growing kale", elsewhere, { fields: FIELDS }))).toEqual([]);
  });
});

describe("highlight", () => {
  test("removes only its own ranges, once", () => {
    CSS.highlights.clear();
    const $p = html("<p>one two</p>"),
      removeOne = highlight(rangesOf($p, value("one")));
    highlight(rangesOf($p, value("two")));
    expect(CSS.highlights.get("psyche")?.size).toBe(2);
    removeOne();
    removeOne();
    expect([...CSS.highlights.get("psyche")!].map(String)).toEqual(["two"]);
  });

  test("highlights in its own name", () => {
    highlight(rangesOf(html("<p>x</p>"), value("x")), "other");
    expect(CSS.highlights.get("other")?.size).toBe(1);
  });
});

describe("highlightPage", () => {
  const live = () =>
      [...(CSS.highlights.get("psyche") ?? [])].filter((r) => !r.collapsed).map(String),
    until = async (condition: () => unknown, ms = 3000) => {
      const start = performance.now();
      while (!condition()) {
        if (performance.now() - start > ms) throw new Error("timed out waiting");
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    };

  test("highlights a page's match, and its removal clears it", () => {
    const $root = html("<article><h1>Home</h1><p>Welcome to the garden</p></article>"),
      remove = highlightPage($root, value("garden"));
    expect(live()).toEqual(["garden"]);
    remove();
    expect(live()).toEqual([]);
  });

  test("highlights it again when its matched text is re-rendered", async () => {
    const $root = html("<article><p>Welcome to the garden</p></article>"),
      remove = highlightPage($root, value("garden"));
    // as an island hydrating would, replacing the matched text's node
    const $p = $root.querySelector("p")!;
    $p.replaceChildren(document.createTextNode($p.textContent!));
    await until(() => live().length);
    expect(live()).toEqual(["garden"]);
    remove();
  });

  test("scrolls to its match's nearest element with a box", () => {
    scrollTo(0, 0);
    const $root = html(
        `<article><div style="height: 300vh"></div>
        <p>Welcome to the <span style="display: contents">garden</span></p></article>`,
      ),
      remove = highlightPage($root, value("garden"));
    const { top, bottom } = $root.querySelector("p")!.getBoundingClientRect();
    expect(top >= 0 && bottom <= innerHeight).toBe(true);
    remove();
    scrollTo(0, 0);
  });
});

describe("scrollToHighlight", () => {
  test("centres the first highlight in the page's order with a box", () => {
    scrollTo(0, 0);
    const $root = html(
        `<article><p hidden>hidden kale</p><div style="height: 300vh"></div>
        <p>first kale</p><div style="height: 300vh"></div><p>second kale</p></article>`,
      ),
      [$hidden, $first, $second] = $root.querySelectorAll("p"),
      // added out of the page's order
      remove = highlight([
        ...rangesOf($second, value("kale")),
        ...rangesOf($hidden, value("kale")),
        ...rangesOf($first, value("kale")),
      ]);
    expect(scrollToHighlight("psyche", "instant")).toBe(true);
    const { top, height } = $first.getBoundingClientRect();
    expect(Math.abs(top + height / 2 - innerHeight / 2) < 2).toBe(true);
    remove();
    scrollTo(0, 0);
  });

  test("returns false without a highlight to scroll to", () => {
    expect(scrollToHighlight("none", "instant")).toBe(false);
  });
});
