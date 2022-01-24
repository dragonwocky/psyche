/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

import { ClientConfig } from "../types.d.ts";
import { construct } from "./ui.ts";
import { listen } from "./hotkeys.ts";
import { modifier } from "./platform.ts";

const defaults: ClientConfig = {
  theme: {
    font: {
      sans: "Inter", // "sans-serif",
      mono: "Fira Code", // "monospace",
    },
    animationDuration: "100ms",
    light: {
      text: "#0f0f0f",
      secondary: "#3f3f46",
      background: "#dee2e6",
      shadow: "rgba(255, 255, 255, 0.6)",
      border: "#d4d4d8",
      accent: "#a78bfa", // "#60a5fa",
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
      accent: "#d8b4fe", // "#93c5fd",
      interactive: "#1f1f1f",
      scrollbar: "#222222",
      scrollbarHover: "#2d2d2d",
    },
    darkMode: "class",
    scrollbarStyle: "square",
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
    { kbd: `${modifier} + K`, label: "to search" },
    { kbd: `${modifier} + SHIFT + L`, label: "to toggle theme" },
  ],
  index: await fetch("/search.json").then((res) => res.json()),
};

const $ = construct(defaults),
  _hotkeyListener = listen($);
document.body.append($);
