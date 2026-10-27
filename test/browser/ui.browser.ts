import { closeSearch, openSearch } from "../../src/client";
import { mount } from "../../src/mount";
import workerUrl from "./fixture.worker?worker&url";
import { describe, expect, test } from "./harness";

const until = async (condition: () => unknown, ms = 3000) => {
    const start = performance.now();
    while (!condition()) {
      if (performance.now() - start > ms) throw new Error("timed out waiting");
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  },
  $ = <E extends Element = HTMLElement>(selector: string) => document.querySelector<E>(selector),
  $$ = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)],
  type = (text: string) => {
    const $input = $<HTMLInputElement>(".psyche-input")!;
    $input.value = text;
    $input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  };

describe("<Search> via mount", () => {
  test("injects its styles once and renders closed", () => {
    const unmount = mount({ worker: workerUrl }),
      again = mount({ worker: workerUrl });
    expect($$("style[data-psyche]").length).toBe(1);
    expect($(".psyche")?.dataset.open).toBe("false");
    again();
    unmount();
    expect($$(".psyche").length).toBe(0);
  });

  test("lists the sitemap in section groups when opened", async () => {
    const unmount = mount({ worker: workerUrl });
    openSearch();
    await until(() => $$(".psyche-result").length);
    expect($(".psyche")?.dataset.open).toBe("true");
    expect(document.activeElement).toBe($(".psyche-input"));
    expect($$(".psyche-section").map((el) => el.textContent)).toEqual(["Pages", "Posts"]);
    expect($$(".psyche-result .psyche-title").map((el) => el.textContent)).toEqual([
      "Home",
      "Growing kale",
      "Planting garlic",
    ]);
    closeSearch();
    unmount();
  });

  test("renders results with tags, a matched heading and highlights", async () => {
    const unmount = mount({ worker: workerUrl });
    openSearch();
    type("preparing soil");
    await until(() => $(".psyche-heading"));
    const $result = $(".psyche-result")!;
    expect($result.getAttribute("href")?.endsWith("/posts/kale?search=preparing+soil#soil")).toBe(
      true,
    );
    expect($$(".psyche-tag").map((el) => [el.textContent, el.dataset.field])).toEqual([
      ["Alice", "authors"],
      ["Gardening", "categories"],
    ]);
    await until(() => CSS.highlights.get("psyche")?.size);
    expect([...CSS.highlights.get("psyche")!].map(String)).toEqual(["Preparing the soil"]);
    closeSearch();
    unmount();
  });

  test("moves and closes by its pills", async () => {
    const unmount = mount({ worker: workerUrl });
    openSearch();
    type("");
    await until(() => $$(".psyche-result").length === 3);
    $<HTMLButtonElement>("[aria-label='Next result']")!.click();
    await until(() => $$(".psyche-result")[1].dataset.selected === "true");
    $<HTMLButtonElement>("[aria-label='Previous result']")!.click();
    await until(() => $$(".psyche-result")[0].dataset.selected === "true");
    $<HTMLButtonElement>("[aria-label='Close search']")!.click();
    expect($(".psyche")?.dataset.open).toBe("false");
    unmount();
  });

  test("shows its legend and branding", () => {
    const unmount = mount({ worker: workerUrl });
    expect(/^(⌘|CTRL) \+ K$/.test($(".psyche-footer kbd")!.textContent!)).toBe(true);
    expect($(".psyche-footer p")!.textContent!.endsWith("to toggle search")).toBe(true);
    expect($(".psyche-brand")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Search by psyche");
    expect($$(".psyche-brand svg").length).toBe(1);
    unmount();
  });

  test("says when nothing matches", async () => {
    const unmount = mount({ worker: workerUrl, noResults: "Nothing here." });
    openSearch();
    type("zzzz");
    await until(() => $(".psyche-empty"));
    expect($(".psyche-empty")!.textContent).toBe("Nothing here.");
    closeSearch();
    unmount();
  });
});
