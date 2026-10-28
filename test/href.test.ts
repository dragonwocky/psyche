import { describe, expect, it } from "vitest";

import { fragmentOf, linkOf, resolve } from "../src/href";

describe("resolve", () => {
  it("resolves a value's link against its record's, kept relative to the site", () => {
    expect(resolve("#frost", "/posts/kale/")).toBe("/posts/kale/#frost");
    expect(resolve("#entry", "/media?entry=1")).toBe("/media?entry=1#entry");
    expect(resolve("/tags/kale", "/posts/kale/")).toBe("/tags/kale");
    expect(resolve("#frost", "https://x.test/posts")).toBe("https://x.test/posts#frost");
  });
});

describe("fragmentOf", () => {
  it("is a link's fragment within its record's page", () => {
    expect(fragmentOf("#frost", "/posts/kale/")).toBe("frost");
    expect(fragmentOf("/posts/kale/#frost", "/posts/kale/")).toBe("frost");
    expect(fragmentOf("#caf%C3%A9")).toBe("café");
  });

  it("is nothing for a link to another page, or without a fragment", () => {
    expect(fragmentOf("/tags/kale#frost", "/posts/kale/")).toBeUndefined();
    expect(fragmentOf("/posts/kale/", "/posts/kale/")).toBeUndefined();
    expect(fragmentOf(undefined)).toBeUndefined();
  });
});

describe("linkOf", () => {
  it("is a record's match's best value's link, resolved against its own", () => {
    const best = (href?: string) => ({
      href: "/posts/kale/",
      headings: [{ text: "Frost", score: 1, ...(href ? { href } : {}) }],
      best: { key: "headings", index: 0 },
    });
    expect(linkOf(best("#frost"))).toBe("/posts/kale/#frost");
    expect(linkOf(best("../../authors/alice"))).toBe("/authors/alice");
  });

  it("is its own link without a best value with one", () => {
    expect(linkOf({ href: "/posts/kale/" })).toBe("/posts/kale/");
    expect(
      linkOf({ href: "/posts/kale/", title: { text: "Kale", score: 1 }, best: { key: "title" } }),
    ).toBe("/posts/kale/");
  });
});
