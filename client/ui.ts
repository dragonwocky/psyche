/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

/// <reference lib="dom" />

import { ClientConfig } from "../types.d.ts";
import * as styles from "./styles.ts";
import { css, html } from "./dom.ts";

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
  insertRules(styles.reset(config));
  insertRules(css(".rubber-wrapper", styles.wrapper(config)));
  insertRules(css(".rubber-shadow", styles.shadow(config)));
  insertRules(css(".rubber-bubble", styles.bubble(config)));
  insertRules(css(".rubber-input", styles.input(config)));
  insertRules(css(".rubber-input-label", styles.inputLabel(config)));
  insertRules(css(".rubber-input-clear", styles.inputClear(config)));
  insertRules(css(".rubber-input-icon", styles.inputIcon(config)));
  insertRules(css(".rubber-results", styles.results(config)));
  insertRules(css(".rubber-footer", styles.footer(config)));
  insertRules(css(".rubber-hotkey", styles.hotkey(config)));
  insertRules(css(".rubber-hotkey-list", styles.hotkeyList(config)));
  insertRules(css(".rubber-hotkey kbd", styles.hotkeyKBD(config)));
  insertRules(css(".rubber-copyright", styles.copyright(config)));
  insertRules(css(".rubber-copyright a", styles.copyrightLink(config)));
  insertRules(css(".rubber-copyright img", styles.copyrightImg(config)));

  const $wrapper = html`<div class="rubber-wrapper"></div>`,
    $shadow = html`<div class="rubber-shadow"></div>`,
    $bubble = html`<div class="rubber-bubble"></div>`;
  $wrapper.append($shadow, $bubble);
  $root.append($wrapper);

  const $input = html`
      <input class="rubber-input" type="search"
        placeholder="${config.messages.placeholder}"
      ></input>
    `,
    $inputLabel = html`<label class="rubber-input-label"></label>`,
    $inputClear = feather("x", "rubber-input-clear"),
    $inputIcon = feather("search", "rubber-input-icon");
  $inputLabel.append($input, $inputClear, $inputIcon);
  $bubble.append($inputLabel);

  const $results = html`<div class="rubber-results"></div>`;
  $bubble.append($results);

  const $footer = html`<footer class="rubber-footer"></footer>`,
    $hotkeys = html`<div class="rubber-hotkey-list"></div>`,
    $copyright = html`<p class="rubber-copyright">
      <span>Search by</span>
      <a href="https://notion-enhancer.github.io/">
        <img src="https://notion-enhancer.github.io/favicon.ico" />
        <span>RubberSearch</span>
      </a>
    </p>`;
  for (const { kbd, label } of config.hotkeys) {
    const $h = html`<p class="rubber-hotkey"><kbd>${kbd}</kbd> ${label}</p>`;
    $hotkeys.append($h);
  }
  $footer.append($hotkeys, $copyright);
  $bubble.append($footer);

  return {
    $component,
  };
};
