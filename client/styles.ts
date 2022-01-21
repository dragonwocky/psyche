/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

/// <reference lib="dom" />

import { ClientConfig, StyleDeclaration } from "../types.d.ts";

export const reset = (_theme: ClientConfig["theme"]): string[] => [
  `
  * {
    box-sizing: border-box;
  }
  `,
  `
  input[type='search']::-webkit-search-decoration,
  input[type='search']::-webkit-search-cancel-button,
  input[type='search']::-webkit-search-results-button,
  input[type='search']::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }
  `,
  `
  input[type='search']:placeholder-shown + svg.feather-x:not(:hover) {
    opacity: 0;
  }
  `,
];

export const wrapper = (theme: ClientConfig["theme"]): StyleDeclaration => ({
    fontSize: "1rem",
    fontFamily: theme.font,
    top: "0",
    left: "0",
    right: "0",
    width: "100%",
    height: "100%",
    position: "fixed",
    padding: "3.5rem 2rem",
    display: "flex",
    justifyContent: "center",
    pointerEvents: "auto",
    transition: "100ms",
    opacity: "1",
    zIndex: "9",
    "<640px": {
      padding: "1rem",
    },
  }),
  shadow = (theme: ClientConfig["theme"]): StyleDeclaration => ({
    top: "0",
    left: "0",
    right: "0",
    width: "100%",
    height: "100%",
    position: "fixed",
    transition: "100ms",
    ".light": {
      background: theme.light.shadow,
    },
    ".dark": {
      background: theme.dark.shadow,
    },
  }),
  bubble = (theme: ClientConfig["theme"]): StyleDeclaration => ({
    transition: "100ms",
    zIndex: "1",
    width: "100%",
    height: "100%",
    maxWidth: "36rem",
    maxHeight: "36rem",
    borderRadius: "0.375rem",
    boxShadow:
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    ".light": {
      color: theme.light.text,
      background: theme.light.background,
    },
    ".dark": {
      color: theme.dark.text,
      background: theme.dark.background,
    },
  });

export const input = (theme: ClientConfig["theme"]): StyleDeclaration => ({
    fontSize: "1em",
    fontFamily: theme.font,
    transition: "100ms",
    appearance: "none",
    display: "block",
    width: "100%",
    lineHeight: "1.75rem",
    border: "none",
    borderRadius: "0.375rem",
    padding: "0.75rem 5.5rem 0.75rem 1rem",
    ".light": {
      color: theme.light.text,
      background: theme.light.card,
      boxShadow: `0 0 0 2px ${theme.light.border}`,
    },
    ".dark": {
      color: theme.dark.text,
      background: theme.dark.card,
      boxShadow: `0 0 0 2px ${theme.dark.border}`,
    },
    ":focus": {
      outline: "none",
      ".light": {
        boxShadow: `0 0 0 2px ${theme.light.accent}`,
      },
      ".dark": {
        boxShadow: `0 0 0 2px ${theme.dark.accent}`,
      },
    },
    "::placeholder": {
      fontFamily: theme.font,
    },
  }),
  inputLabel = (_theme: ClientConfig["theme"]): StyleDeclaration => ({
    display: "block",
    margin: "0.75rem",
    position: "relative",
    fontSize: "1.125rem",
  }),
  inputClear = (theme: ClientConfig["theme"]): StyleDeclaration => ({
    cursor: "pointer",
    width: "3em",
    height: "100%",
    position: "absolute",
    right: "3em",
    bottom: "0",
    top: "0",
    padding: "0.9em 0.75em",
    transition: "100ms",
    ":hover": {
      ".light": {
        color: theme.light.accent,
      },
      ".dark": {
        color: theme.dark.accent,
      },
    },
  }),
  inputIcon = (theme: ClientConfig["theme"]): StyleDeclaration => ({
    width: "3em",
    height: "100%",
    position: "absolute",
    right: "0",
    bottom: "0",
    top: "0",
    padding: "0.9em 0.75em",
    borderRadius: "0.375rem",
    transition: "100ms",
    ".light": {
      background: theme.light.background,
    },
    ".dark": {
      background: theme.dark.background,
    },
  });

//     <div aria-label="results" class="
//       px-3 mt-2 children:last:mb-3 relative overflow-y-auto h-full
//       <sm:max-h-126 sm:max-h-[calc(100%-9.75rem)] empty:after:(text-sm text-dim)
//     ">
//       <ul>
//         <li data-placeholder class="search-result-section">Section</p>
//         <li data-placeholder>
//           <a href="/" class="search-result group">
//             {{ 'align-left' | feather({ class: 'search-result-icon' }) | safe }}
//             <div class="font-medium">
//               <p class="text-sm"><mark class="search-result-highlight"></mark></p>
//               <p class="text-xs"></p>
//             </div>
//           </a>
//         </li>
//       </ul>
//     </div>

//     <footer class="
//       <sm:hidden border-dim border-t p-3 text-sm text-dim
//       flex flex-wrap items-center px-1 py-2
//     ">
//       {% for hotkey in hotkeys %}
//         <p class="px-2 py-1">
//           <kbd class="
//             inline-block px-1.5 py-0.5 text-xs bg-card rounded-md
//             border-2 border-dim shadow mr-1
//           ">{{ hotkey.keys }}</kbd>
//           <span>{{ hotkey.text }}</span>
//         </p>
//       {% endfor %}
//     </footer>
