/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

/// <reference lib="dom" />

import { ClientConfig } from "../types.d.ts";
import * as styles from "./styles.ts";
import { css, html, safe } from "./dom.ts";

import featherIcons from "https://cdn.skypack.dev/feather-icons";
const feather = (icon: string, cls = "") =>
  html([featherIcons.icons[icon].toSvg({ class: cls })]);

class ScopedComponent extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
  }
}
customElements.define("rubber-search", ScopedComponent);

export const construct = (config: ClientConfig) => {
  const $component = html`<rubber-search></rubber-search>`;
  document.body.append($component);
  const $root: ShadowRoot = $component.shadowRoot!,
    $stylesheet = <HTMLStyleElement> html`<style></style>`;
  $root.prepend($stylesheet);

  const sheet = $stylesheet.sheet!,
    insertRules = (rules: string[]) => {
      for (const rule of rules) {
        sheet.insertRule(rule, sheet.cssRules.length);
      }
    };
  insertRules(styles.reset(config.theme));
  insertRules(css(".rubber-wrapper", styles.wrapper(config.theme)));
  insertRules(css(".rubber-shadow", styles.shadow(config.theme)));
  insertRules(css(".rubber-bubble", styles.bubble(config.theme)));
  insertRules(css(".rubber-input", styles.input(config.theme)));
  insertRules(css(".rubber-input-label", styles.inputLabel(config.theme)));
  insertRules(css(".rubber-input-clear", styles.inputClear(config.theme)));
  insertRules(css(".rubber-input-icon", styles.inputIcon(config.theme)));

  const $wrapper = html`<div class="rubber-wrapper"></div>`,
    $shadow = html`<div class="rubber-shadow"></div>`,
    $bubble = html`<div class="rubber-bubble"></div>`;
  $wrapper.append($shadow, $bubble);
  $root.append($wrapper);

  const $label = html`<label class="rubber-input-label"></label>`,
    $input = html`
      <input class="rubber-input" type="search"
        placeholder="${safe(config.messages.placeholder)}"
      ></input>
    `,
    $inputClear = feather("x", "rubber-input-clear"),
    $inputIcon = feather("search", "rubber-input-icon");
  $label.append($input, $inputClear, $inputIcon);
  $bubble.append($label);

  return {
    $component,
  };
};

// aside[aria-label='search'] [aria-label='results']:empty::after {
//   content: 'No results found. Try entering a different search term?';
// }
