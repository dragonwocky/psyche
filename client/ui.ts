/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

/// <reference lib="dom" />

import { ClientConfig, Result, SearchComponent } from "../types.d.ts";
import { feather, html, render, safe } from "./dom.ts";
import { styles } from "./styles.ts";
import { trigger } from "./events.ts";

customElements.define("rubber-search", SearchComponent);

const highlightContent = (content: string, query: string) => {
  const caseInsensitiveQuery = `(${
    safe(query).replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&")
  })`;
  return safe(content).replace(
    new RegExp(caseInsensitiveQuery, "ig"),
    (match) => html`<mark class="search-result-highlight">${match}</mark>`,
  );
};
export const constructResult = (result: Result, query: string) => {
  const icon = result.icon ??
      (result.type === "page"
        ? "file-text"
        : (result.type === "heading" ? "hash"
        : (result.type === "list" ? "list" : "align-left"))),
    description = result.description
      ? html`
          <p class="rubber-result-description">${safe(result.description)}</p>
        `
      : "";
  return html`
    <li><a href="${safe(result.url)}" class="rubber-result">
      ${feather(icon, "rubber-result-icon")}
      <div>
        <p class="rubber-result-content">
          ${highlightContent(result.content, query)}
        </p>
        ${description}
      </div>
    </a></li>
  `;
  // $result.addEventListener("click", gui.close);
};

export const constructSection = (
  section: string,
  results: Result[],
  query: string,
) => {
  return html`
    <ul class="rubber-result-list">
      <li class="rubber-result-section">${safe(section)}</li>
      ${results.map((r) => constructResult(r, query)).join("")}
    </ul>
  `;
};

export const construct = (config: ClientConfig) => {
  const $ = <SearchComponent> render(html`<rubber-search></rubber-search>`);
  $.attachShadow({ mode: "open" });
  const $root = $.shadowRoot!;

  let hotkeys = "";
  for (const { kbd, label } of config.hotkeys) {
    hotkeys += html`<p class="rubber-hotkey"><kbd>${kbd}</kbd> ${label}</p>`;
  }

  $root.append(render(html`
    <style>${styles(config)}</style>
    <div class="rubber-wrapper">
      <div class="rubber-shadow"></div>
      <div class="rubber-bubble">
        <label class="rubber-input-label">
          <input class="rubber-input" type="search"
            placeholder="${safe(config.messages.placeholder)}" />
          ${feather("x", "rubber-input-clear")}
          ${feather("search", "rubber-input-icon")}
        </label>
        <div class="rubber-result-scroller"></div>
        <footer class="rubber-footer">
          <div class="rubber-hotkey-list">${hotkeys}</div>
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
  `));

  const $shadow = $root.querySelector(".rubber-shadow")!,
    $input = $root.querySelector(".rubber-input")!,
    $clear = $root.querySelector(".rubber-input-clear")!;
  $shadow.addEventListener("click", () => trigger($, "close"));
  $input.addEventListener("input", () => trigger($, "search"));
  $clear.addEventListener("click", () => trigger($, "clearInput"));

  return $;
};
