/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

/// <reference lib="dom" />

import { config, styles } from "./config.ts";
import { css, html, safe } from "./dom.ts";

class ScopedComponent extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.prepend(html`<style>${config.reset}</style>`);
  }
}
customElements.define("rubber-search", ScopedComponent);

const $component = html`<rubber-search></rubber-search>`;
document.body.append($component);
const $root: ShadowRoot = $component.shadowRoot!;

css(".rubber-wrapper", {
  styles: styles.wrapper,
  $sheet: $root.styleSheets[0],
});
const $wrapper = html`<div class="rubber-wrapper"></div>`;

css(".rubber-shadow", {
  styles: styles.shadow,
  $sheet: $root.styleSheets[0],
});
const $shadow = html`<div class="rubber-shadow"></div>`;

css(".rubber-bubble", {
  styles: styles.bubble,
  $sheet: $root.styleSheets[0],
});
const $bubble = html`<div class="rubber-bubble"></div>`;

css(".rubber-label", {
  styles: styles.label,
  $sheet: $root.styleSheets[0],
});
const $label = html`<label class="rubber-label"></label>`;

css(".rubber-input", {
  styles: styles.input,
  $sheet: $root.styleSheets[0],
});
const $input = html`
  <input class="rubber-input" type="search"
    placeholder="${safe(config.messages.placeholder)}"
  ></input>
`;

$label.append($input);
$bubble.append($label);
$wrapper.append($shadow, $bubble);
$root.append($wrapper);

//       {{ 'x' | feather({ 'data-action': 'clear-search', class: '
//         feather absolute right-12 bottom-0 w-12 pl-3 pr-3 py-4
//         h-full transition hover:(!opacity-100 text-primary) cursor-pointer
//       ' }) | safe }}
//       {{ 'search' | feather({ class: '
//         feather absolute right-0 bottom-0 w-12 pl-3 pr-3 py-4
//         h-full bg-body rounded-r-md
//       ' }) | safe }}
