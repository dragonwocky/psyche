/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

/// <reference lib="dom" />

import { ClientConfig, Result } from "../types.d.ts";
import { styles } from "./styles.ts";
import { css, html } from "./dom.ts";

import featherIcons from "https://cdn.skypack.dev/feather-icons";
const feather = (icon: string, cls = "") =>
  html([featherIcons.icons[icon].toSvg({ class: cls })]);

class RubberSearchElement extends HTMLElement {}
customElements.define("rubber-search", RubberSearchElement);

export const constructResult = () => {
  return html`<li>
    <a href="/" class="rubber-result">
      ${feather("align-left", "rubber-result-icon")}
      <div>
        <p class="rubber-result-content">ab<mark class="rubber-result-highlight">cde</mark>f</p>
        <p class="rubber-result-description">ghijkl</p>
      </div>
    </a>
  </li>`;
};

export const construct = () => {
  const $component: RubberSearchElement = html`<rubber-search></rubber-search>`;
  $component.attachShadow({ mode: "open" });
  const $root = $component.shadowRoot!;
  $root.append(html`
    <style>

    </style>
  `);
  return $component;
};

export const style = ($: RubberSearchElement, config: ClientConfig) => {
  const $root = $.shadowRoot!,
    $stylesheet = $root.styleSheets[0]!,
    insertRules = (rules: string[]) => {
      const i = () => $stylesheet.cssRules.length;
      for (const rule of rules) $stylesheet.insertRule(rule, i());
    };
  for (const s in styles) insertRules(css(s, styles[s](config)));
};

export const populate = ($: RubberSearchElement, config: ClientConfig) => {
  const $root = $.shadowRoot!;

  const $hotkeys = html`<div class="rubber-hotkey-list"></div>`;
  for (const { kbd, label } of config.hotkeys) {
    const $h = html`<p class="rubber-hotkey"><kbd>${kbd}</kbd> ${label}</p>`;
    $hotkeys.append($h);
  }

  $root.append(html`
    <div class="rubber-wrapper">
      <div class="rubber-shadow"></div>
      <div class="rubber-bubble">
        <label class="rubber-input-label">
          <input class="rubber-input" type="search"
            placeholder="${config.messages.placeholder}" />
          ${feather("x", "rubber-input-clear")}
          ${feather("search", "rubber-input-icon")}
        </label>
        <div class="rubber-result-scroller">
          <ul class="rubber-result-list">
            <li class="rubber-result-section">Section</p>
            ${constructResult()}
            ${constructResult()}
            ${constructResult()}
          </ul>
        </div>
        <footer class="rubber-footer">
          ${$hotkeys}
          <p class="rubber-copyright">
            <span>Search by</span>
            <a href="https://notion-enhancer.github.io/">
              <img src="https://notion-enhancer.github.io/favicon.ico" />
              <span>RubberSearch</span>
            </a>
          </p>
        </footer>
      </div>
    </div>
  `);
};

export const open = ($: RubberSearchElement) => {
  const $root = $.shadowRoot!,
    $wrapper = $root.querySelector(".rubber-wrapper")!,
    $input: HTMLInputElement = $root.querySelector(".rubber-input")!;
  $wrapper.classList.remove("rubber-wrapper-hidden");
  $input.focus();
};

export const close = ($: RubberSearchElement) => {
  const $root = $.shadowRoot!,
    $wrapper = $root.querySelector(".rubber-wrapper")!,
    $input: HTMLInputElement = $root.querySelector(".rubber-input")!;
  $wrapper.classList.add("rubber-wrapper-hidden");
  $input.blur();
};

export const toggle = ($: RubberSearchElement) => {
  const $root = $.shadowRoot!,
    $wrapper = $root.querySelector(".rubber-wrapper")!;
  if ($wrapper.classList.contains("rubber-wrapper-hidden")) {
    open($);
  } else close($);
};

export const listen = ($: RubberSearchElement) => {
  const $root = $.shadowRoot!,
    $shadow = $root.querySelector(".rubber-shadow")!,
    $input: HTMLInputElement = $root.querySelector(".rubber-input")!,
    $clear = $root.querySelector(".rubber-input-clear")!;
  $shadow.addEventListener("click", () => close($));
  $clear.addEventListener("click", () => {
    $input.value = "";
  });
};
