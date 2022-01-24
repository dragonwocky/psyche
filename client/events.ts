/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

/// <reference lib="dom" />

import { ClientEvent, SearchComponent } from "../types.d.ts";

const clearInput = ($root: ShadowRoot, ..._args: unknown[]) => {
    const $input: HTMLInputElement = $root.querySelector(".rubber-input")!;
    $input.value = "";
  },
  blurInput = ($root: ShadowRoot, ..._args: unknown[]) => {
    const $input: HTMLInputElement = $root.querySelector(".rubber-input")!;
    $input.blur();
  },
  focusInput = ($root: ShadowRoot, ..._args: unknown[]) => {
    const $input: HTMLInputElement = $root.querySelector(".rubber-input")!;
    $input.focus();
  };

const open = ($root: ShadowRoot, ..._args: unknown[]) => {
    const $wrapper = $root.querySelector(".rubber-wrapper")!;
    $wrapper.classList.remove("rubber-wrapper-hidden");
    focusInput($root);
  },
  close = ($root: ShadowRoot, ..._args: unknown[]) => {
    const $wrapper = $root.querySelector(".rubber-wrapper")!;
    $wrapper.classList.add("rubber-wrapper-hidden");
    blurInput($root);
  },
  toggle = ($root: ShadowRoot, ..._args: unknown[]) => {
    const $wrapper = $root.querySelector(".rubber-wrapper")!,
      isHidden = $wrapper.classList.contains("rubber-wrapper-hidden");
    if (isHidden) open($root);
    else close($root);
  };

const search = ($root: ShadowRoot, ..._args: unknown[]) => {
  $root;
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

const focusPrev = ($root: ShadowRoot, ..._args: unknown[]) => {
    $root;
  },
  focusNext = ($root: ShadowRoot, ..._args: unknown[]) => {
    $root;
  };

export const trigger = (
  $: SearchComponent,
  event: ClientEvent,
  ...args: unknown[]
) => {
  const $root = $.shadowRoot!,
    events = {
      open,
      close,
      toggle,
      search,
      clearInput,
      blurInput,
      focusInput,
      focusPrev,
      focusNext,
    };
  events[event]($root, ...args);
};
