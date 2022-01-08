/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

/// <reference lib="dom" />

export type StyleVariant =
  | ".light"
  | ".dark"
  | ":hover"
  | ":focus"
  | ":active"
  | "::before"
  | "::after"
  | "::placeholder"
  | "<640px";
export type StyleDeclaration =
  & {
    [P in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[P] extends string
      ? CSSStyleDeclaration[P]
      : never;
  }
  & { [k in StyleVariant]?: StyleDeclaration };

interface Theme {
  font: string;
  light: {
    shadow: string;
    background: string;
    card: string;
    border: string;
    accent: string;
    text: string;
  };
  dark: {
    shadow: string;
    background: string;
    card: string;
    border: string;
    accent: string;
    text: string;
  };
}
export interface Config {
  reset: string;
  theme: Theme;
  messages: {
    placeholder: string;
  };
}

export const config: Config = {
  reset: `
    input[type='search']::-webkit-search-decoration,
    input[type='search']::-webkit-search-cancel-button,
    input[type='search']::-webkit-search-results-button,
    input[type='search']::-webkit-search-results-decoration {
      -webkit-appearance: none;
    }
  `,
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

const wrapper = (theme: Theme): StyleDeclaration => ({
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
});

const shadow = (theme: Theme): StyleDeclaration => ({
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
});

const bubble = (theme: Theme): StyleDeclaration => ({
  transition: "100ms",
  zIndex: "1",
  width: "100%",
  height: "100%",
  maxWidth: "36em",
  maxHeight: "36em",
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

const label = (_theme: Theme): StyleDeclaration => ({
  display: "block",
  margin: "0.75rem",
  position: "relative",
});

const input = (theme: Theme): StyleDeclaration => ({
  fontFamily: theme.font,
  transition: "100ms",
  appearance: "none",
  display: "block",
  width: "100%",
  fontSize: "1.125rem",
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
});

export const styles = {
  wrapper: wrapper(config.theme),
  shadow: shadow(config.theme),
  bubble: bubble(config.theme),
  label: label(config.theme),
  input: input(config.theme),
};

//     <label class="block m-3 relative">
//       <input type="search" name="site-search" aria-label="search the notion-enhancer documentation" class="
//         block w-full text-lg rounded-md bg-light-600 dark:bg-dark-500 py-3 pl-4 pr-22
//         transition ring-dim focus:ring-primary appearance-none placeholder-shown:sibling:opacity-0
//       " placeholder="Search docs...">

//       {{ 'x' | feather({ 'data-action': 'clear-search', class: '
//         feather absolute right-12 bottom-0 w-12 pl-3 pr-3 py-4
//         h-full transition hover:(!opacity-100 text-primary) cursor-pointer
//       ' }) | safe }}
//       {{ 'search' | feather({ class: '
//         feather absolute right-0 bottom-0 w-12 pl-3 pr-3 py-4
//         h-full bg-body rounded-r-md
//       ' }) | safe }}
//     </label>

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
