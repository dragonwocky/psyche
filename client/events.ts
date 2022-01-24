/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

import { Result, SearchComponent } from "../types.d.ts";
import { render } from "./dom.ts";
import { constructSection } from "./ui.ts";
import * as logic from "./logic.ts";

export const clearInput = ($: SearchComponent) => {
    const $input: HTMLInputElement = $.shadowRoot!.querySelector(
      ".rubber-input",
    )!;
    $input.value = "";
  },
  blurInput = ($: SearchComponent) => {
    const $input: HTMLInputElement = $.shadowRoot!.querySelector(
      ".rubber-input",
    )!;
    $input.blur();
  },
  focusInput = ($: SearchComponent) => {
    const $input: HTMLInputElement = $.shadowRoot!.querySelector(
      ".rubber-input",
    )!;
    $input.focus();
  };

export const open = ($: SearchComponent) => {
    const $wrapper = $.shadowRoot!.querySelector(".rubber-wrapper")!;
    $wrapper.classList.remove("rubber-wrapper-hidden");
    focusInput($);
  },
  close = ($: SearchComponent) => {
    const $wrapper = $.shadowRoot!.querySelector(".rubber-wrapper")!;
    $wrapper.classList.add("rubber-wrapper-hidden");
    blurInput($);
  },
  toggle = ($: SearchComponent) => {
    const $wrapper = $.shadowRoot!.querySelector(".rubber-wrapper")!,
      isHidden = $wrapper.classList.contains("rubber-wrapper-hidden");
    if (isHidden) open($);
    else close($);
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

//   gui.scrollResultsToTop = () => $.resultsList().scrollTo({ top: 0 });
// gui.scrollActiveToCenter = () =>
//   document.activeElement?.scrollIntoView?.({ block: "center" });
// gui.focusPrev = () => {
//   if (!gui.isOpen()) return;
//   const $results = $.results(),
//     i = $results.findIndex(($r) => $r === document.activeElement);
//   if (document.activeElement === $.input()) {
//     $results[$results.length - 1]?.focus({ preventScroll: true });
//   } else if (i > 0) {
//     $results[i - 1]?.focus({ preventScroll: true });
//   } else {
//     $.input().focus();
//     gui.scrollResultsToTop();
//   }
//   gui.scrollActiveToCenter();
// };
// gui.focusNext = () => {
//   if (!gui.isOpen()) return;
//   const $results = $.results(),
//     i = $results.findIndex(($r) => $r === document.activeElement);
//   if (document.activeElement === $.input()) {
//     $results[0]?.focus({ preventScroll: true });
//   } else if (i > -1 && i < $results.length - 1) {
//     $results[i + 1]?.focus({ preventScroll: true });
//   } else {
//     $.input().focus();
//     gui.scrollResultsToTop();
//   }
//   gui.scrollActiveToCenter();
// };

// export const focusPrev = ($: SearchComponent) => {
//   },
//   focusNext = ($: SearchComponent) => {
//   };
