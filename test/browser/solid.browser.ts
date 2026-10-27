import { createEffect, createRoot } from "solid-js";

import { useSearch } from "../../src/solid";
import { createSearch } from "../../src/store";
import { FIELDS, type Page } from "./fixture";
import workerUrl from "./fixture.worker?worker&url";
import { describe, expect, test } from "./harness";

const until = async (condition: () => unknown, ms = 3000) => {
  const start = performance.now();
  while (!condition()) {
    if (performance.now() - start > ms) throw new Error("timed out waiting");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

describe("useSearch", () => {
  test("is the store's state as a signal, until its root is disposed", async () => {
    const search = createSearch<Page>({ worker: workerUrl, fields: FIELDS }),
      seen: string[] = [];
    const dispose = createRoot((dispose) => {
      const state = useSearch(search);
      createEffect(() =>
        seen.push(
          state()
            .results.map((result) => result.href)
            .join(),
        ),
      );
      return dispose;
    });
    search.input("garlic");
    await until(() => seen.includes("/posts/garlic"));
    dispose();
    search.input("welcome");
    await until(() => search.getState().results[0]?.href === "/");
    expect(seen.includes("/")).toBe(false);
  });
});
