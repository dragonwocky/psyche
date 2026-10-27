import { expect, it } from "vitest";

import { createHighlights } from "../src/highlight";

// the rest of highlight.ts is tested in chrome, see test/browser
it("does nothing without the highlight api", () => {
  expect(() => createHighlights()([undefined, "x"])).not.toThrow();
});
