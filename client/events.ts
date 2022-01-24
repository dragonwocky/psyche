/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

import { Result, SearchComponent } from "../types.d.ts";
import { render } from "./dom.ts";
import {
  constructSection,
  getActiveResult,
  inputHasFocus,
  isHidden,
} from "./ui.ts";
import * as logic from "./logic.ts";

export const clearInput = ($: SearchComponent) => {
    const $root = $.shadowRoot!,
      $input: HTMLInputElement = $root.querySelector(".rubber-input")!;
    $input.value = "";
  },
  blurInput = ($: SearchComponent) => {
    const $root = $.shadowRoot!,
      $input: HTMLInputElement = $root.querySelector(".rubber-input")!;
    $input.blur();
  },
  focusInput = ($: SearchComponent) => {
    const $root = $.shadowRoot!,
      $input: HTMLInputElement = $root.querySelector(".rubber-input")!;
    $input.focus();
  };

export const open = ($: SearchComponent) => {
    const $root = $.shadowRoot!,
      $wrapper = $root.querySelector(".rubber-wrapper")!,
      $bubble = $root.querySelector(".rubber-bubble")!;
    $wrapper.classList.remove("rubber-wrapper-hidden");
    focusInput($);
    $bubble.animate([
      { transform: "scale(0.99)" },
      { transform: "scale(1.01, 1.01)" },
      { transform: "scale(1, 1)" },
    ], { duration: 200, easing: "ease" });
  },
  close = ($: SearchComponent) => {
    const $root = $.shadowRoot!,
      $wrapper = $root.querySelector(".rubber-wrapper")!;
    $wrapper.classList.add("rubber-wrapper-hidden");
    blurInput($);
  };

export const search = async ($: SearchComponent, index: Result[]) => {
  const $root = $.shadowRoot!,
    $input = <HTMLInputElement> $root.querySelector(".rubber-input")!,
    $results = $root.querySelector(".rubber-result-scroller")!,
    query = $input.value,
    grouped = logic.group(logic.search(index, query)),
    $fragment = new DocumentFragment();
  for (const section in grouped) {
    $fragment.append(
      render(constructSection(section, grouped[section], query)),
    );
    // prevent thread blocking
    await new Promise((res, _rej) => requestIdleCallback(res));
    if ($input.value !== query) return grouped;
  }
  $results.innerHTML = "";
  $results.append($fragment);
  $fragment.querySelectorAll(".rubber-result").forEach(($r) =>
    $r.addEventListener("click", () => void close($))
  );
  return grouped;
};

const focus = ($: SearchComponent, direction: "prev" | "next") => {
  if (isHidden($)) return;
  let $active = getActiveResult($);
  const $root = $.shadowRoot!,
    $scroller = $root.querySelector(".rubber-result-scroller")!,
    $results = <HTMLElement[]> [...$root.querySelectorAll(".rubber-result")],
    resultIndex = $active ? $results.indexOf($active) : -1,
    indexInBounds = direction === "next"
      ? resultIndex > -1 && resultIndex < $results.length - 1
      : resultIndex > 0;
  if (inputHasFocus($) && $results.length) {
    const $target = direction === "next"
      ? $results[0]
      : $results[$results.length - 1];
    $target.focus({ preventScroll: true });
  } else if (indexInBounds) {
    const $target = direction === "next"
      ? $results[resultIndex + 1]
      : $results[resultIndex - 1];
    $target.focus({ preventScroll: true });
  } else {
    focusInput($);
    $scroller.scrollTo({ top: 0 });
  }
  $active = getActiveResult($);
  if ($active) $active.scrollIntoView({ block: "center" });
};

export const focusPrev = ($: SearchComponent) => focus($, "prev"),
  focusNext = ($: SearchComponent) => focus($, "next");
