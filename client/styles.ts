/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

/// <reference lib="dom" />

import { ClientConfig, StyleDeclaration } from "../types.d.ts";

export const styles: Record<
  string,
  (config: ClientConfig) => StyleDeclaration
> = {
  "*": () => ({
    boxSizing: "border-box",
  }),

  ".rubber-wrapper": ({ theme }) => ({
    transition: theme.animationDuration,
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
    opacity: "1",
    zIndex: "9",
    "<640px": {
      padding: "1rem",
    },
  }),
  ".rubber-wrapper-hidden": () => ({
    pointerEvents: "none",
    opacity: "0",
  }),

  ".rubber-shadow": ({ theme }) => ({
    transition: theme.animationDuration,
    top: "0",
    left: "0",
    right: "0",
    width: "100%",
    height: "100%",
    position: "fixed",
    ".light": {
      background: theme.light.shadow,
    },
    ".dark": {
      background: theme.dark.shadow,
    },
  }),
  ".rubber-bubble": ({ theme }) => ({
    transition: theme.animationDuration,
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
  }),

  ".rubber-input": ({ theme }) => ({
    transition: theme.animationDuration,
    fontSize: "1em",
    fontFamily: theme.font.sans,
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
  ".rubber-input-label": () => ({
    display: "block",
    margin: "0.75rem",
    position: "relative",
    fontSize: "1.125rem",
    lineHeight: "1.75rem",
  }),
  ".rubber-input-clear": ({ theme }) => ({
    transition: theme.animationDuration,
    cursor: "pointer",
    width: "3em",
    height: "100%",
    position: "absolute",
    right: "3em",
    bottom: "0",
    top: "0",
    padding: "0.75em",
    ":hover": {
      ".light": {
        color: theme.light.accent,
      },
      ".dark": {
        color: theme.dark.accent,
      },
    },
  }),
  ".rubber-input:placeholder-shown + .rubber-input-clear:not(:hover)": () => ({
    opacity: "0",
  }),
  ".rubber-input-icon": ({ theme }) => ({
    transition: theme.animationDuration,
    width: "3em",
    height: "100%",
    position: "absolute",
    right: "0",
    bottom: "0",
    top: "0",
    padding: "0.75em",
    borderTopRightRadius: "0.375rem",
    borderBottomRightRadius: "0.375rem",
    ".light": {
      background: theme.light.background,
    },
    ".dark": {
      background: theme.dark.background,
    },
  }),
  "::-webkit-search-decoration, ::-webkit-search-cancel-button, ::-webkit-search-results-button, ::-webkit-search-results-decoration":
    () => ({
      appearance: "none",
    }),

  ".rubber-result": ({ theme }) => ({
    transition: theme.animationDuration,
    textDecoration: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    width: "100%",
    marginBottom: "1rem",
    padding: "0.75rem 1rem",
    borderRadius: "0.375rem",
    ".light": {
      color: theme.light.text,
      background: theme.light.interactive,
    },
    ".dark": {
      color: theme.dark.text,
      background: theme.dark.interactive,
    },
    ":hover": {
      ".light": {
        background: theme.light.accent,
      },
      ".dark": {
        background: theme.dark.accent,
      },
    },
    ":focus": {
      outline: "none",
      ".light": {
        background: theme.light.accent,
      },
      ".dark": {
        background: theme.dark.accent,
      },
    },
  }),
  ".rubber-result-scroller": ({ theme, messages }) => ({
    marginTop: "0.25rem",
    padding: "0 0.75rem 0.75rem 0.75rem",
    overflowY: "auto",
    overflowWrap: "break-word",
    ":empty": {
      "::after": {
        transition: theme.animationDuration,
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
  }),
  ".rubber-result-list": () => ({
    padding: "0",
    marginBlock: "0",
  }),
  ".rubber-result-section": ({ theme }) => ({
    transition: theme.animationDuration,
    display: "block",
    width: "100%",
    position: "sticky",
    top: "0",
    paddingBottom: "0.5rem",
    ".light": {
      color: theme.light.accent,
      background: theme.light.background,
    },
    ".dark": {
      color: theme.dark.accent,
      background: theme.dark.background,
    },
  }),
  ".rubber-result-icon": ({ theme }) => ({
    height: "1.5rem",
    width: "1.5rem",
    marginRight: "1rem",
    flexShrink: "0",
    ".light": {
      color: theme.light.secondary,
    },
    ".dark": {
      color: theme.dark.secondary,
    },
  }),
  ".rubber-result-content": () => ({
    margin: "0",
    fontWeight: "500",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  }),
  ".rubber-result-description": ({ theme }) => ({
    margin: "0",
    fontWeight: "500",
    fontSize: "0.75rem",
    lineHeight: "1rem",
    ".light": {
      color: theme.light.secondary,
    },
    ".dark": {
      color: theme.dark.secondary,
    },
  }),
  ".rubber-result-highlight": ({ theme }) => ({
    background: "transparent",
    ".light": {
      color: theme.light.accent,
    },
    ".dark": {
      color: theme.dark.accent,
    },
  }),
  ".rubber-result:hover *, .rubber-result:focus *": ({ theme }) => ({
    ".light": {
      color: theme.light.interactive,
    },
    ".dark": {
      color: theme.dark.interactive,
    },
  }),

  ".rubber-footer": ({ theme }) => ({
    transition: theme.animationDuration,
    display: "flex",
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

  ".rubber-hotkey": () => ({
    margin: "0.5rem",
    "<640px": {
      display: "none",
    },
  }),
  ".rubber-hotkey-list": () => ({
    display: "flex",
    flexWrap: "wrap",
    margin: "auto 0",
  }),
  ".rubber-hotkey kbd": ({ theme }) => ({
    transition: theme.animationDuration,
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

  ".rubber-copyright": () => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "end",
    padding: "0.5rem 0",
    margin: "auto 0.5rem 0 auto",
    "<640px": {
      padding: "0",
      flexDirection: "row",
    },
  }),
  ".rubber-copyright a": ({ theme }) => ({
    transition: theme.animationDuration,
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
  ".rubber-copyright img": () => ({
    width: "1em",
    height: "1em",
    margin: "0 0.25rem",
  }),
};
