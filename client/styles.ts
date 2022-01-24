/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

import { ClientConfig } from "../types.d.ts";
import { css } from "./dom.ts";

export const styles = (config: ClientConfig) => {
  const { darkMode } = config.theme,
    darkPrefix = darkMode === "class"
      ? ":host-context(.dark)"
      : "@media (prefers-color-scheme: dark) { :host",
    darkSuffix = darkMode === "class" ? "" : "}";

  return css`
    :host {
      --font-sans: ${config.theme.font.sans};
      --font-mono: ${config.theme.font.mono};
      --animation-duration: ${config.theme.animationDuration};
      --theme-text: ${config.theme.light.text};
      --theme-secondary: ${config.theme.light.secondary};
      --theme-background: ${config.theme.light.background};
      --theme-shadow: ${config.theme.light.shadow};
      --theme-border: ${config.theme.light.border};
      --theme-accent: ${config.theme.light.accent};
      --theme-interactive: ${config.theme.light.interactive};
      --message-empty: "${config.messages.empty.replace(/"/g, '\\"')}";
    }

    ${darkPrefix} {
      --theme-text: ${config.theme.dark.text};
      --theme-secondary: ${config.theme.dark.secondary};
      --theme-background: ${config.theme.dark.background};
      --theme-shadow: ${config.theme.dark.shadow};
      --theme-border: ${config.theme.dark.border};
      --theme-accent: ${config.theme.dark.accent};
      --theme-interactive: ${config.theme.dark.interactive};
    } ${darkSuffix}

    * {
      box-sizing: border-box;
    }

    .rubber-wrapper,
    .rubber-shadow,
    .rubber-bubble,
    .rubber-input,
    .rubber-input-clear,
    .rubber-input-icon,
    .rubber-result,
    .rubber-result-scroller:empty::after,
    .rubber-result-section,
    .rubber-footer,
    .rubber-hotkey kbd,
    .rubber-copyright a {
      transition: all var(--animation-duration) ease 0s;
    }

    .rubber-wrapper,
    .rubber-input,
    .rubber-input::placeholder {
      font-family: var(--font-sans);
    }
    .rubber-hotkey kbd {
      font-family: var(--font-mono);
    }

    .rubber-wrapper {
      font-size: 1rem;
      top: 0px;
      left: 0px;
      right: 0px;
      width: 100%;
      height: 100%;
      position: fixed;
      padding: 3.5rem 2rem;
      display: flex;
      justify-content: center;
      pointer-events: auto;
      opacity: 1;
      z-index: 9;
    }
    .rubber-wrapper-hidden {
      pointer-events: none;
      opacity: 0;
    }

    .rubber-shadow {
      top: 0px;
      left: 0px;
      right: 0px;
      width: 100%;
      height: 100%;
      position: fixed;
      background: var(--theme-shadow);
    }
    .rubber-bubble {
      z-index: 1;
      width: 100%;
      height: 100%;
      max-width: 36rem;
      max-height: 36rem;
      display: flex;
      flex-direction: column;
      border-radius: 0.375rem;
      box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px;
      color: var(--theme-text);
      background: var(--theme-background);
    }

    .rubber-input-label {
      display: block;
      margin: 0.75rem;
      position: relative;
      font-size: 1.125rem;
      line-height: 1.75rem;
    }
    .rubber-input {
      font-size: 1em;
      appearance: none;
      display: block;
      width: 100%;
      border: none;
      border-radius: 0.375rem;
      padding: 0.75rem 5.5rem 0.75rem 1rem;
      color: var(--theme-text);
      background: var(--theme-interactive);
      box-shadow: var(--theme-border) 0px 0px 0px 2px;
    }
    .rubber-input:focus {
      outline: none;
      box-shadow: var(--theme-accent) 0px 0px 0px 2px;
    }
    .rubber-input::-webkit-search-decoration,
    .rubber-input::-webkit-search-cancel-button,
    .rubber-input::-webkit-search-results-button,
    .rubber-input::-webkit-search-results-decoration {
      appearance: none;
    }

    .rubber-input-clear {
      cursor: pointer;
      width: 3em;
      height: 100%;
      position: absolute;
      right: 3em;
      bottom: 0px;
      top: 0px;
      padding: 0.75em;
    }
    .rubber-input-clear:hover {
      color: var(--theme-accent);
    }
    .rubber-input:placeholder-shown + .rubber-input-clear:not(:hover) {
      opacity: 0;
    }

    .rubber-input-icon {
      width: 3em;
      height: 100%;
      position: absolute;
      right: 0px;
      bottom: 0px;
      top: 0px;
      padding: 0.75em;
      border-top-right-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;
      background: var(--theme-background);
    }

    .rubber-result-scroller {
      margin-top: 0.25rem;
      padding: 0px 0.75rem 0.75rem;
      overflow-y: auto;
      overflow-wrap: break-word;
    }
    .rubber-result-scroller:empty::after {
      content: var(--message-empty);
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: var(--theme-secondary);
    }

    .rubber-result-list {
      padding: 0px;
      margin-block-start: 0px;
      margin-block-end: 0px;
    }
    .rubber-result-section {
      display: block;
      width: 100%;
      position: sticky;
      top: 0px;
      padding-bottom: 0.5rem;
      color: var(--theme-accent);
      background: var(--theme-background);
    }

    .rubber-result {
      text-decoration: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      width: 100%;
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 0.375rem;
      color: var(--theme-text);
      background: var(--theme-interactive);
    }
    .rubber-result:hover,
    .rubber-result:focus {
      outline: none;
      background: var(--theme-accent);
    }

    .rubber-result-icon {
      height: 1.5rem;
      width: 1.5rem;
      margin-right: 1rem;
      flex-shrink: 0;
      color: var(--theme-secondary);
    }
    .rubber-result-content {
      margin: 0px;
      font-weight: 500;
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
    .rubber-result-description {
      margin: 0px;
      font-weight: 500;
      font-size: 0.75rem;
      line-height: 1rem;
      color: var(--theme-secondary);
    }
    .rubber-result-highlight {
      background: transparent;
      color: var(--theme-accent);
    }
    .rubber-result:hover *,
    .rubber-result:focus * {
      color: var(--theme-interactive);
    }

    .rubber-footer {
      display: flex;
      font-size: 0.75rem;
      line-height: 1.25rem;
      margin-top: auto;
      padding: 0.5rem 0.25rem;
      color: var(--theme-secondary);
      border-top: 2px solid var(--theme-border);
    }

    .rubber-hotkey-list {
      display: flex;
      flex-wrap: wrap;
      margin: auto 0px;
    }
    .rubber-hotkey {
      margin: 0.5rem;
    }
    .rubber-hotkey kbd {
      padding: 0.25rem;
      margin-right: 0.25rem;
      font-size: 0.65rem;
      line-height: 1rem;
      border-radius: 0.375rem;
      box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px;
      color: var(--theme-text);
      background: var(--theme-interactive);
      border: 2px solid var(--theme-border);
    }

    .rubber-copyright {
      display: flex;
      flex-direction: column;
      align-items: end;
      padding: 0.5rem 0px;
      margin: auto 0.5rem 0px auto;
    }
    .rubber-copyright a {
      display: inline-flex;
      align-items: center;
      text-decoration: none;
      color: var(--theme-accent);
    }
    .rubber-copyright img {
      width: 1em;
      height: 1em;
      margin: 0px 0.25rem;
    }

    @media (max-width: 640px) {
      .rubber-wrapper {
        padding: 1rem;
      }
      .rubber-hotkey {
        display: none;
      }
      .rubber-copyright {
        padding: 0px;
        flex-direction: row;
      }
    }
  `;
};
