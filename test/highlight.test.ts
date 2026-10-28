import { expect, it } from "vitest";

import { highlight, rangesOf } from "../src/highlight";

// the rest of highlight.ts is tested in chrome, see test/browser
it("does nothing without the highlight api or a document", () => {
  expect(() => highlight([])()).not.toThrow();
  expect(rangesOf({ title: undefined }, { record: {}, score: 1, best: { key: "title" } })).toEqual(
    [],
  );
});
