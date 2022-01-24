/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

import { ClientConfig, RecursivePartial } from "../types.d.ts";
import { construct } from "./ui.ts";
import { createListener } from "./hotkeys.ts";
import { close, open } from "./events.ts";
import { modifier } from "./platform.ts";

export type { ClientConfig } from "../types.d.ts";
export { modifier } from "./platform.ts";

const defaults: ClientConfig = {
  theme: {
    font: {
      sans: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      mono: "Courier, monospace",
    },
    light: {
      text: "#0f0f0f",
      secondary: "#3f3f46",
      background: "#dee2e6",
      shadow: "rgba(255, 255, 255, 0.6)",
      border: "#d4d4d8",
      accent: "#60a5fa",
      interactive: "#f1f3f5",
      scrollbar: "#d4d4d8",
      scrollbarHover: "#a1a1aa",
    },
    dark: {
      text: "#dde1e3",
      secondary: "#a1a1aa",
      background: "#181818",
      shadow: "rgba(0, 0, 0, 0.6)",
      border: "#222222",
      accent: "#93c5fd",
      interactive: "#1f1f1f",
      scrollbar: "#222222",
      scrollbarHover: "#2d2d2d",
    },
    darkMode: "class",
    scrollbarStyle: "rounded",
  },
  messages: {
    placeholder: "Search docs...",
    empty: "No results found. Try entering a different search term?",
  },
  hotkeys: [
    { kbd: "↵", label: "to select" },
    { kbd: "↑ ↓", label: "to navigate" },
    { kbd: "ESC", label: "to close" },
    { kbd: "/", label: "to focus" },
    { kbd: `${modifier} + K`, label: "to toggle search" },
  ],
  index: [],
};

const isDict = <Type>(value: Type): value is Type & Record<string, unknown> =>
    (<Record<string, unknown>> value).constructor === Object,
  merge = (a: unknown, b: unknown) => {
    if (!a || !isDict(a)) return {};
    if (!b || !isDict(b)) return a;
    const merged = { ...a };
    for (const [k, v] of Object.entries(b)) {
      if (isDict(v)) {
        if (isDict(merged[k])) {
          merged[k] = merge(<Record<string, unknown>> merged[k], v);
        } else merged[k] = merge({}, v);
      } else merged[k] = v;
    }
    return merged;
  };

export const psyche = (user: RecursivePartial<ClientConfig>) => {
  const config = <ClientConfig> {
    theme: merge(defaults.theme, user.theme),
    messages: merge(defaults.messages, user.messages),
    hotkeys: [...defaults.hotkeys, ...(user.hotkeys ?? [])],
    index: user.index ?? defaults.index,
  };
  const $ = construct(config),
    hotkeys = createListener($);
  return {
    $psyche: $,
    register: () => {
      $.remove();
      document.addEventListener("keydown", hotkeys);
    },
    unregister: () => {
      $.remove();
      document.removeEventListener("keydown", hotkeys);
    },
    open: () => void open($),
    close: () => void close($),
  };
};
