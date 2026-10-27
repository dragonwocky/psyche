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
    const $input = $<HTMLInputElement>(".psyche input[type=search]")!;
    $input.value = text;
    $input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  };

describe("<Search> via mount", () => {
  test("renders closed, and unmounts", () => {
    const unmount = mount({ worker: workerUrl });
    expect($(".psyche")?.dataset.open).toBe("false");
    unmount();
    expect($$(".psyche").length).toBe(0);
  });

  test("lists the sitemap in section groups when opened", async () => {
    const unmount = mount({ worker: workerUrl });
    openSearch();
    await until(() => $$(".psyche a[data-selected]").length);
    expect($(".psyche")?.dataset.open).toBe("true");
    expect(document.activeElement).toBe($(".psyche input[type=search]"));
    expect($$(".psyche h2").map((el) => el.textContent)).toEqual(["Pages", "Posts"]);
    expect($$(".psyche [data-psyche=title]").map((el) => el.textContent)).toEqual([
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
    await until(() => $(".psyche [data-psyche=headings]"));
    const $result = $(".psyche a[data-selected]")!;
    expect($result.getAttribute("href")?.endsWith("/posts/kale?search=preparing+soil#soil")).toBe(
      true,
    );
    expect(
      $$(".psyche [data-psyche=tags] > *").map((el) => [el.textContent, el.dataset.field]),
    ).toEqual([
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
    await until(() => $$(".psyche a[data-selected]").length === 3);
    $<HTMLButtonElement>("[aria-label='Next result']")!.click();
    await until(() => $$(".psyche a[data-selected]")[1].dataset.selected === "true");
    $<HTMLButtonElement>("[aria-label='Previous result']")!.click();
    await until(() => $$(".psyche a[data-selected]")[0].dataset.selected === "true");
    $<HTMLButtonElement>("[aria-label='Close search']")!.click();
    expect($(".psyche")?.dataset.open).toBe("false");
    unmount();
  });

  test("shows its legend and branding", () => {
    const unmount = mount({ worker: workerUrl });
    expect(/^(⌘|CTRL) \+ K$/.test($(".psyche footer kbd")!.textContent!)).toBe(true);
    expect($(".psyche footer p")!.textContent!.endsWith("to toggle search")).toBe(true);
    expect($(".psyche footer a")!.textContent!.replace(/\s+/g, " ").trim()).toBe(
      "Search by psyche",
    );
    expect($$(".psyche footer a svg").length).toBe(1);
    unmount();
  });

  test("says when nothing matches", async () => {
    const unmount = mount({ worker: workerUrl, noResults: "Nothing here." });
    openSearch();
    type("zzzz");
    await until(() => $(".psyche [role=dialog]")!.textContent!.includes("Nothing here."));
    closeSearch();
    unmount();
  });
});
