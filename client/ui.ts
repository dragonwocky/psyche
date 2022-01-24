/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */
/// <reference lib="dom" />

import { ClientConfig, Result, SearchComponent } from "../types.d.ts";
import { feather, html, render, safe } from "./dom.ts";
import { properties, scoped } from "./styles.ts";
import { clearInput, close, search } from "./events.ts";

customElements.define("rubber-search", SearchComponent);

const highlightContent = (content: string, query: string) => {
  if (!query.length) return safe(content);
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
      ? html`<p class="rubber-result-desc">${safe(result.description)}</p>`
      : "";
  return html`
    <li>
      <a href="${safe(result.url)}" class="rubber-result">
        ${feather(icon, "rubber-result-icon")}
        <div>
          <p class="rubber-result-content">
            ${highlightContent(result.content, query)}
          </p>
          ${description}
        </div>
      </a>
    </li>
  `;
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
  $.append(render(html`<style>${properties(config)}</style>`));
  $.attachShadow({ mode: "open" });
  const $root = $.shadowRoot!;

  const hotkeys = config.hotkeys.map(({ kbd, label }) =>
    html`<p class="rubber-hotkey"><kbd>${kbd}</kbd> ${label}</p>`
  ).join("");
  $root.append(render(html`
    <style>${scoped(config)}</style>
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
  $shadow.addEventListener("click", () => void close($));
  $input.addEventListener("input", () => void search($, config.index));
  $clear.addEventListener("click", () => void clearInput($));

  search($, config.index);
  return $;
};
