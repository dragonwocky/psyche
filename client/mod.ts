/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

import { ClientConfig } from "../types.d.ts";
import { construct } from "./ui.ts";

const defaults: ClientConfig = {
  theme: {
    font: "Inter", // "sans-serif",
    light: {
      shadow: "rgba(255, 255, 255, 0.6)",
      background: "#dee2e6",
      card: "#f1f3f5",
      border: "#d4d4d8",
      accent: "#a78bfa", // "#60a5fa",
      text: "#0f0f0f",
    },
    dark: {
      shadow: "rgba(0, 0, 0, 0.6)",
      background: "#181818",
      card: "#1f1f1f",
      border: "#222222",
      accent: "#d8b4fe", // "#93c5fd",
      text: "#dde1e3",
    },
  },
  messages: {
    placeholder: "Search docs...",
  },
};

construct(defaults);
