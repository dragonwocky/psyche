/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

/// <reference lib="dom" />

import type { Result } from "../../types.d.ts";
import * as logic from "../logic.ts";
import { render } from "../util.ts";
import {
  constructSection,
  getActiveResult,
  inputHasFocus,
  isHidden,
  SearchComponent,
} from "./elements.ts";

const clearInput = ($: SearchComponent) => {
    const $root = $.shadowRoot!,
      $input: HTMLInputElement = $root.querySelector(".psyche-input")!;
    $input.value = "";
  },
  blurInput = ($: SearchComponent) => {
    const $root = $.shadowRoot!,
      $input: HTMLInputElement = $root.querySelector(".psyche-input")!;
    $input.blur();
  },
  focusInput = ($: SearchComponent) => {
    const $root = $.shadowRoot!,
      $input: HTMLInputElement = $root.querySelector(".psyche-input")!;
    $input.focus();
  };

const open = ($: SearchComponent) => {
    const $root = $.shadowRoot!,
      $wrapper = $root.querySelector(".psyche-wrapper")!,
      $bubble = $root.querySelector(".psyche-bubble")!;
    $wrapper.classList.remove("psyche-wrapper-hidden");
    focusInput($);
    $bubble.animate([
      { transform: "scale(0.99)" },
      { transform: "scale(1.01, 1.01)" },
      { transform: "scale(1, 1)" },
    ], { duration: 200, easing: "ease" });
  },
  close = ($: SearchComponent) => {
    const $root = $.shadowRoot!,
      $wrapper = $root.querySelector(".psyche-wrapper")!;
    $wrapper.classList.add("psyche-wrapper-hidden");
    blurInput($);
  };

const search = async ($: SearchComponent, index: Result[]) => {
  const $root = $.shadowRoot!,
    $input = <HTMLInputElement> $root.querySelector(".psyche-input")!,
    $results = $root.querySelector(".psyche-result-scroller")!,
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
  $results.querySelectorAll(".psyche-result").forEach(($r) =>
    $r.addEventListener("click", () => void close($))
  );
  return grouped;
};

const focus = ($: SearchComponent, direction: "prev" | "next") => {
    if (isHidden($)) return;
    let $active = getActiveResult($);
    const $root = $.shadowRoot!,
      $scroller = $root.querySelector(".psyche-result-scroller")!,
      $results = Array.from($root.querySelectorAll(".psyche-result")),
      resultIndex = $active ? $results.indexOf($active) : -1,
      indexInBounds = direction === "next"
        ? resultIndex > -1 && resultIndex < $results.length - 1
        : resultIndex > 0;
    if (inputHasFocus($) && $results.length) {
      const $target = <HTMLElement> (direction === "next"
        ? $results[0]
        : $results[$results.length - 1]);
      $target.focus({ preventScroll: true });
    } else if (indexInBounds) {
      const $target = <HTMLElement> (direction === "next"
        ? $results[resultIndex + 1]
        : $results[resultIndex - 1]);
      $target.focus({ preventScroll: true });
    } else {
      focusInput($);
      $scroller.scrollTo({ top: 0 });
    }
    $active = getActiveResult($);
    if ($active) $active.scrollIntoView({ block: "center" });
  },
  focusPrev = ($: SearchComponent) => focus($, "prev"),
  focusNext = ($: SearchComponent) => focus($, "next");

export {
  blurInput,
  clearInput,
  close,
  focusInput,
  focusNext,
  focusPrev,
  open,
  search,
};
