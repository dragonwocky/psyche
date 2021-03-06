/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

/// <reference lib="dom" />

// the psyche.min.mjs bundle is generated via:
// npx -y esbuild client/mod.ts --minify --bundle --format=esm > client/psyche.min.mjs

import type {
  ClientConfig,
  ClientInstance,
  RecursivePartial,
} from "../types.d.ts";
import { platformModifier } from "./util.ts";
import { construct } from "./dom/elements.ts";
import { createListener } from "./dom/hotkeys.ts";
import { close, open } from "./dom/triggers.ts";

const defaults: ClientConfig = {
  theme: {
    font: {
      sans: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      mono: "'Courier New', Courier, monospace",
    },
    light: {
      text: "#0f0f0f",
      secondary: "#3f3f46",
      background: "#dee2e6",
      shadow: "rgba(255, 255, 255, 0.6)",
      border: "#d4d4d8",
      accent: "#ea596e",
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
      accent: "#f4abba",
      interactive: "#1f1f1f",
      scrollbar: "#222222",
      scrollbarHover: "#2d2d2d",
    },
    darkMode: "class",
    scrollbarStyle: "rounded",
  },
  messages: {
    inputPlaceholder: "Search docs...",
    noResultsFound: "No results found. Try entering a different search term?",
  },
  hotkeys: [
    { kbd: "↵", label: "to select" },
    { kbd: "↑ ↓", label: "to navigate" },
    { kbd: "ESC", label: "to close" },
    { kbd: "/", label: "to focus" },
    { kbd: `${platformModifier} + K`, label: "to toggle search" },
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

const psyche = (user: RecursivePartial<ClientConfig>): ClientInstance => {
  const config = <ClientConfig> {
    theme: merge(defaults.theme, user.theme),
    messages: merge(defaults.messages, user.messages),
    hotkeys: [...defaults.hotkeys, ...(user.hotkeys ?? [])],
    index: user.index ?? defaults.index,
  };
  const $ = construct(config),
    hotkeys = createListener($);
  return {
    $component: $,
    register: () => {
      const $conflict = document.querySelector("psyche-search");
      if ($conflict) {
        const err = "Cannot register multiple Psyche clients at the same time!";
        throw new Error(err);
      }
      document.body.append($);
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

export default psyche;
export { registerHotkey, unregisterHotkey } from "./dom/hotkeys.ts";
export { platformModifier } from "./util.ts";
