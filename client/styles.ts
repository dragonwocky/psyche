/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

/// <reference lib="dom" />

import { ClientConfig, StyleDeclaration } from "../types.d.ts";

export const reset = ({}: ClientConfig): string[] => [
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

export const wrapper = ({ theme }: ClientConfig): StyleDeclaration => ({
    fontSize: "1rem",
    fontFamily: theme.font.sans,
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
  shadow = ({ theme }: ClientConfig): StyleDeclaration => ({
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
  bubble = ({ theme }: ClientConfig): StyleDeclaration => ({
    transition: "100ms",
    zIndex: "1",
    width: "100%",
    height: "100%",
    maxWidth: "36rem",
    maxHeight: "36rem",
    display: "flex",
    flexDirection: "column",
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

export const input = ({ theme }: ClientConfig): StyleDeclaration => ({
    fontSize: "1em",
    fontFamily: theme.font.sans,
    transition: "100ms",
    appearance: "none",
    display: "block",
    width: "100%",
    border: "none",
    borderRadius: "0.375rem",
    padding: "0.75rem 5.5rem 0.75rem 1rem",
    ".light": {
      color: theme.light.text,
      background: theme.light.interactive,
      boxShadow: `0 0 0 2px ${theme.light.border}`,
    },
    ".dark": {
      color: theme.dark.text,
      background: theme.dark.interactive,
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
      fontFamily: theme.font.sans,
    },
  }),
  inputLabel = ({}: ClientConfig): StyleDeclaration => ({
    display: "block",
    margin: "0.75rem",
    position: "relative",
    fontSize: "1.125rem",
    lineHeight: "1.75rem",
  }),
  inputClear = ({ theme }: ClientConfig): StyleDeclaration => ({
    cursor: "pointer",
    width: "3em",
    height: "100%",
    position: "absolute",
    right: "3em",
    bottom: "0",
    top: "0",
    padding: "0.75em",
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
  inputIcon = ({ theme }: ClientConfig): StyleDeclaration => ({
    width: "3em",
    height: "100%",
    position: "absolute",
    right: "0",
    bottom: "0",
    top: "0",
    padding: "0.75em",
    borderRadius: "0.375rem",
    transition: "100ms",
    ".light": {
      background: theme.light.background,
    },
    ".dark": {
      background: theme.dark.background,
    },
  });

export const results = (
  { theme, messages }: ClientConfig,
): StyleDeclaration => ({
  marginTop: "0.25rem",
  padding: "0 0.75rem 0.75rem 0.75rem",
  overflowY: "auto",
  overflowWrap: "break-word",
  ":empty": {
    "::after": {
      content: `"${messages.empty.replace(/"/g, '\\"')}"`,
      fontSize: "0.875rem",
      lineHeight: "1.25rem",
      ".light": {
        color: theme.light.secondary,
      },
      ".dark": {
        color: theme.dark.secondary,
      },
    },
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

export const footer = ({ theme }: ClientConfig): StyleDeclaration => ({
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.75rem",
    lineHeight: "1.25rem",
    marginTop: "auto",
    padding: "0.5rem 0.25rem",
    ".light": {
      color: theme.light.secondary,
      borderTop: `solid 2px ${theme.light.border}`,
    },
    ".dark": {
      color: theme.dark.secondary,
      borderTop: `solid 2px ${theme.dark.border}`,
    },
  }),
  hotkey = ({}: ClientConfig): StyleDeclaration => ({
    margin: "0.5rem",
    "<640px": {
      display: "none",
    },
  }),
  kbd = ({ theme }: ClientConfig): StyleDeclaration => ({
    fontFamily: theme.font.mono,
    padding: "0.25rem",
    marginRight: "0.25rem",
    fontSize: "0.65rem",
    lineHeight: "1rem",
    borderRadius: "0.375rem",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    ".light": {
      color: theme.light.text,
      background: theme.light.interactive,
      border: `solid 2px ${theme.light.border}`,
    },
    ".dark": {
      color: theme.dark.text,
      background: theme.dark.interactive,
      border: `solid 2px ${theme.dark.border}`,
    },
  }),
  copyright = ({}: ClientConfig): StyleDeclaration => ({
    display: "flex",
    alignItems: "center",
    margin: "0.5rem 0.5rem 0.5rem auto",
  }),
  copyrightLink = ({ theme }: ClientConfig): StyleDeclaration => ({
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    ".light": {
      color: theme.light.accent,
    },
    ".dark": {
      color: theme.dark.accent,
    },
  }),
  copyrightImg = ({}: ClientConfig): StyleDeclaration => ({
    width: "1em",
    height: "1em",
    margin: "0 0.25rem",
  });
