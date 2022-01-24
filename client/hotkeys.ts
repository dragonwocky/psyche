/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

import { SearchComponent } from "../types.d.ts";
import { modifier } from "./platform.ts";
import { toggle } from "./events.ts";

const test = (
  event: KeyboardEvent,
  combination: Partial<KeyboardEvent>,
) => {
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
      combination: {
        shiftKey: false,
        altKey: false,
        metaKey: modifier === "⌘",
        ctrlKey: modifier === "CTRL",
        key: "k",
      },
      handler: (event) => {
        event.preventDefault();
        toggle($);
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

// const hotkeys = [
//   // toggle
//   (event: KeyboardEvent) => {
//   },
//   // navigation
//   (event: KeyboardEvent) => {
//     if (!gui.isOpen()) return;
//     if (event.key === "Escape") gui.close();
//     if (event.key === "ArrowUp") {
//       event.preventDefault();
//       gui.focusPrev();
//     }
//     if (event.key === "ArrowDown") {
//       event.preventDefault();
//       gui.focusNext();
//     }
//     if (event.key === "/" && document.activeElement !== $.input()) {
//       event.preventDefault();
//       $.input().focus();
//     }
//     if (event.key === "Enter" && document.activeElement === $.input()) {
//       gui.focusNext();
//       (<HTMLElement> document.activeElement)?.click();
//     }
//   },
// ];
