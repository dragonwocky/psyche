/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

import { SearchComponent } from "../types.d.ts";
import { modifier } from "./platform.ts";
import { close, focusInput, focusNext, focusPrev, open } from "./events.ts";
import { getActiveResult, inputHasFocus, isHidden } from "./ui.ts";

const test = (
  event: KeyboardEvent,
  combination: Partial<KeyboardEvent>,
) => {
  combination = {
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ctrlKey: false,
    ...combination,
  };
  for (const k in combination) {
    const key = <keyof KeyboardEvent> k;
    if (event[key] !== combination[key]) return false;
  }
  return true;
};

export const listen = ($: SearchComponent) => {
  const hotkeys: {
    combination: Partial<KeyboardEvent>;
    handler: (event: KeyboardEvent) => void;
  }[] = [
    {
      combination: { key: "Enter" },
      handler: () => {
        if (isHidden($) || !inputHasFocus($)) return;
        focusNext($);
        const $active = getActiveResult($);
        if ($active) $active.click();
      },
    },
    {
      combination: { key: "ArrowUp" },
      handler: (event) => {
        if (isHidden($)) return;
        event.preventDefault();
        focusPrev($);
      },
    },
    {
      combination: { key: "ArrowDown" },
      handler: (event) => {
        if (isHidden($)) return;
        event.preventDefault();
        focusNext($);
      },
    },

    {
      combination: { key: "Escape" },
      handler: () => {
        if (!isHidden($)) close($);
      },
    },
    {
      combination: { key: "/" },
      handler: (event) => {
        if (isHidden($) || inputHasFocus($)) return;
        event.preventDefault();
        focusInput($);
      },
    },

    {
      combination: {
        metaKey: modifier === "⌘",
        ctrlKey: modifier === "CTRL",
        key: "k",
      },
      handler: (event) => {
        event.preventDefault();
        isHidden($) ? open($) : close($);
      },
    },
  ];

  const eventListener = (event: KeyboardEvent) => {
    for (const hotkey of hotkeys) {
      if (test(event, hotkey.combination)) hotkey.handler(event);
    }
  };
  document.addEventListener("keydown", eventListener);
  return eventListener;
};
