/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

import type { ClientHotkey } from "../../types.d.ts";
import type { SearchComponent } from "./elements.ts";
import { isMac } from "../util.ts";
import { getActiveResult, inputHasFocus, isHidden } from "./elements.ts";
import { close, focusInput, focusNext, focusPrev, open } from "./triggers.ts";

const hotkeys: Set<ClientHotkey> = new Set(),
  registerHotkey = (hotkey: ClientHotkey) => hotkeys.add(hotkey),
  unregisterHotkey = (hotkey: ClientHotkey) => hotkeys.delete(hotkey);

const testHotkey = (event: KeyboardEvent, hotkey: ClientHotkey) => {
    const testProps = {
      shiftKey: false,
      altKey: false,
      metaKey: hotkey.platformModifier ? isMac : false,
      ctrlKey: hotkey.platformModifier ? !isMac : false,
      ...hotkey,
    };
    delete testProps.platformModifier;
    delete testProps.onkeydown;
    delete testProps.onkeyup;
    for (const k in testProps) {
      const key = <keyof KeyboardEvent> k,
        matches = key === "key"
          ? (event[key].toLowerCase() === testProps[key]!.toLowerCase())
          : event[key] === testProps[key];
      if (!matches) return false;
    }
    return true;
  },
  createListener = ($: SearchComponent) => {
    return (event: KeyboardEvent) => {
      for (const hotkey of hotkeys) {
        if (!testHotkey(event, hotkey)) continue;
        if (hotkey.onkeydown) hotkey.onkeydown(event, $);
        if (hotkey.onkeyup) hotkey.onkeyup(event, $);
      }
    };
  };

registerHotkey({
  key: "Enter",
  onkeydown: (_event, $) => {
    if (isHidden($) || !inputHasFocus($)) return;
    focusNext($);
    const $active = getActiveResult($);
    if ($active) $active.click();
  },
});
registerHotkey({
  key: "ArrowUp",
  onkeydown: (event, $) => {
    if (isHidden($)) return;
    event.preventDefault();
    focusPrev($);
  },
});
registerHotkey({
  key: "ArrowDown",
  onkeydown: (event, $) => {
    if (isHidden($)) return;
    event.preventDefault();
    focusNext($);
  },
});
registerHotkey({
  key: "Escape",
  onkeydown: (_event, $) => {
    if (!isHidden($)) close($);
  },
});
registerHotkey({
  key: "/",
  onkeydown: (event, $) => {
    if (isHidden($) || inputHasFocus($)) return;
    event.preventDefault();
    focusInput($);
  },
});
registerHotkey({
  platformModifier: true,
  key: "k",
  onkeydown: (event, $) => {
    event.preventDefault();
    isHidden($) ? open($) : close($);
  },
});

export { createListener, registerHotkey, unregisterHotkey };
