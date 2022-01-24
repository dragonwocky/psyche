/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */
/// <reference lib="dom" />

import { ClientConfig, Result, SearchComponent } from "../types.d.ts";
import { feather, html, render, safe } from "./dom.ts";
import { properties, scoped } from "./styles.ts";
import { clearInput, close, search } from "./triggers.ts";

customElements.define("psyche-search", SearchComponent);

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
      ? html`<p class="psyche-result-desc">${safe(result.description)}</p>`
      : "";
  return html`
    <li>
      <a href="${safe(result.url)}" class="psyche-result">
        ${feather(icon, "psyche-result-icon")}
        <div>
          <p class="psyche-result-content">
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
    <ul class="psyche-result-list">
      <li class="psyche-result-section">${safe(section)}</li>
      ${results.map((r) => constructResult(r, query)).join("")}
    </ul>
  `;
};

export const construct = (config: ClientConfig) => {
  const $ = <SearchComponent> render(html`<psyche-search></psyche-search>`);
  $.append(render(html`<style>${properties(config)}</style>`));
  $.attachShadow({ mode: "open" });
  const $root = $.shadowRoot!;

  const hotkeys = config.hotkeys.map(({ kbd, label }) =>
    html`<p class="psyche-hotkey"><kbd>${kbd}</kbd> ${label}</p>`
  ).join("");
  $root.append(render(html`
    <style>${scoped(config)}</style>
    <div class="psyche-wrapper psyche-wrapper-hidden">
      <div class="psyche-shadow"></div>
      <div class="psyche-bubble">
        <label class="psyche-input-label">
          <input class="psyche-input" type="search"
            placeholder="${safe(config.messages.placeholder)}" />
          ${feather("x", "psyche-input-clear")}
          ${feather("search", "psyche-input-icon")}
        </label>
        <div class="psyche-result-scroller"></div>
        <footer class="psyche-footer">
          <div class="psyche-hotkey-list">${hotkeys}</div>
          <p class="psyche-copyright">
            <span>Search by</span>
            <a href="https://github.com/dragonwocky/psyche">
              <img src="https://notion-enhancer.github.io/favicon.ico" />
              <span>psyche</span>
            </a>
          </p>
        </footer>
      </div>
    </div>
  `));

  const $shadow = $root.querySelector(".psyche-shadow")!,
    $input = $root.querySelector(".psyche-input")!,
    $clear = $root.querySelector(".psyche-input-clear")!;
  $shadow.addEventListener("click", () => void close($));
  $input.addEventListener("input", () => void search($, config.index));
  $clear.addEventListener("click", () => void clearInput($));

  search($, config.index);
  return $;
};

export const isHidden = ($: SearchComponent) => {
  const $wrapper = $.shadowRoot!.querySelector(".psyche-wrapper")!,
    isHidden = $wrapper.classList.contains("psyche-wrapper-hidden");
  return isHidden;
};

export const inputHasFocus = ($: SearchComponent) => {
  const $root = $.shadowRoot!,
    $input = $root.querySelector(".psyche-input")!;
  return document.activeElement === $ && $root.activeElement === $input;
};

export const getActiveResult = ($: SearchComponent) => {
  const $root = $.shadowRoot!,
    $active =
      $root.activeElement && $root.activeElement.matches(".psyche-result")
        ? <HTMLElement> $root.activeElement
        : null;
  return $active;
};
