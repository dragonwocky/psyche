/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

// import { Result } from "../types.ts";
import { isDict } from "../util.ts";
import { svgElements, svgNamespace } from "./svg.ts";
// import { group, search } from "./logic.ts";
import htm from "https://cdn.skypack.dev/htm";
import { setup, tw } from "https://cdn.skypack.dev/twind";
import featherIcons from "https://cdn.skypack.dev/feather-icons";
setup({ mode: "silent" });

const h = (
    type: string,
    props: Record<string, unknown>,
    ...children: (string | Element)[]
  ): string | Element => {
    const $ = svgElements.includes(type)
      ? document.createElementNS(svgNamespace, type)
      : document.createElement(type);
    for (const [k, v] of Object.entries(props ?? {})) {
      if (["string", "number"].includes(typeof v)) {
        $.setAttribute(k, k === "class" ? tw(v) : "" + v);
      } else if (typeof v === "function" && k.startsWith("on")) {
        const event = <keyof HTMLElementEventMap> k.slice(2);
        $.addEventListener(event, <EventListener> v);
      } else if (k === "style" && isDict(v)) {
        const styles = <Record<string, string>> v;
        for (let prop in styles) {
          const value = styles[prop];
          prop = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
          $.style.setProperty(prop, value);
        }
      } else $.setAttribute(k, JSON.stringify(v));
    }
    $.append(...children);
    return $;
  },
  html = htm.bind(h),
  svg = (icon: string) => html([featherIcons.icons[icon].toSvg()]);

document.body.prepend(
  html
    `<h1 id=${1} class="h-screen bg-purple-400 flex items-center justify-center" style=${{
      backgroundColor: "red",
    }} onclick=${console.log}><span>${svg("download")}</span>!</h1>`,
);

export const ui = () => {
  html`
  <aside aria-label="search" class="
  fixed top-0 h-full w-full flex justify-center p-4 z-10
  sm:(py-12 px-8) opacity-0 pointer-events-none transition duration-50
">
  <div data-action="close-search" class="
    fixed top-0 w-full h-full bg-white
    bg-opacity-60 dark:(bg-black bg-opacity-60)
  "></div>

  <div class="z-11 max-w-144 w-full max-h-144 bg-body rounded-md shadow-lg overflow-hidden">

    <label class="block m-3 relative">
      <input type="search" name="site-search" aria-label="search the notion-enhancer documentation" class="
        block w-full text-lg rounded-md bg-light-600 dark:bg-dark-500 py-3 pl-4 pr-22
        transition ring-dim focus:ring-primary appearance-none placeholder-shown:sibling:opacity-0
      " placeholder="Search docs...">
      
      {{ 'x' | feather({ 'data-action': 'clear-search', class: '
        feather absolute right-12 bottom-0 w-12 pl-3 pr-3 py-4
        h-full transition hover:(!opacity-100 text-primary) cursor-pointer
      ' }) | safe }}
      {{ 'search' | feather({ class: '
        feather absolute right-0 bottom-0 w-12 pl-3 pr-3 py-4
        h-full bg-body rounded-r-md
      ' }) | safe }}
    </label>

    <div aria-label="results" class="
      px-3 mt-2 children:last:mb-3 relative overflow-y-auto h-full
      <sm:max-h-126 sm:max-h-[calc(100%-9.75rem)] empty:after:(text-sm text-dim)
    ">
      <ul>
        <li data-placeholder class="search-result-section">Section</p>
        <li data-placeholder>
          <a href="/" class="search-result group">
            {{ 'align-left' | feather({ class: 'search-result-icon' }) | safe }}
            <div class="font-medium">
              <p class="text-sm"><mark class="search-result-highlight"></mark></p>
              <p class="text-xs"></p>
            </div>
          </a>
        </li>
      </ul>
    </div>

    <footer class="
      <sm:hidden border-dim border-t p-3 text-sm text-dim
      flex flex-wrap items-center px-1 py-2
    ">
      {% for hotkey in hotkeys %}
        <p class="px-2 py-1">
          <kbd class="
            inline-block px-1.5 py-0.5 text-xs bg-card rounded-md
            border-2 border-dim shadow mr-1
          ">{{ hotkey.keys }}</kbd>
          <span>{{ hotkey.text }}</span>
        </p>
      {% endfor %}
    </footer>
  </div>
</aside>
`;
};

// interface SearchResult {
//   url: string;
//   type: "page" | "heading" | "inline";
//   section: string;
//   page?: string;
//   text: string;
// }

// const $ = {
//   triggers: () => document.querySelectorAll('[data-action="open-search"]'),
//   header: () => <HTMLElement> document.querySelector("header"),
//   showTrigger: ($t: Element) =>
//     !$.header().contains($t) && $.triggers().length !== 1 ? "add" : "remove",
//   container: () =>
//     <HTMLElement> document.querySelector('aside[aria-label="search"]'),
//   input: () =>
//     <HTMLInputElement> $.container().querySelector('input[type="search"]'),
//   clear: () =>
//     <HTMLElement> $.container().querySelector('[data-action="clear-search"]'),
//   close: () =>
//     <HTMLElement> $.container().querySelector('[data-action="close-search"]'),
//   resultsList: () =>
//     <HTMLElement> $.container().querySelector('[aria-label="results"]'),
//   results: () => Array.from($.resultsList().querySelectorAll("a")),
// };

// const gui: Record<string, () => unknown> = {};
// gui.isOpen = () => !$.container().classList.contains("opacity-0");
// gui.open = () => {
//   $.container().classList.remove("pointer-events-none", "opacity-0");
//   $.input().focus();
// };
// gui.close = () => {
//   $.container().classList.add("pointer-events-none", "opacity-0");
//   $.input().blur();
// };
// gui.toggle = () => gui.isOpen() ? gui.close() : gui.open();
// gui.clear = () => {
//   (<HTMLInputElement> $.input()).value = "";
//   $.resultsList().innerHTML = "";
// };

// gui.scrollResultsToTop = () => $.resultsList().scrollTo({ top: 0 });
// gui.scrollActiveToCenter = () =>
//   document.activeElement?.scrollIntoView?.({ block: "center" });
// gui.focusPrev = () => {
//   if (!gui.isOpen()) return;
//   const $results = $.results(),
//     i = $results.findIndex(($r) => $r === document.activeElement);
//   if (document.activeElement === $.input()) {
//     $results[$results.length - 1]?.focus({ preventScroll: true });
//   } else if (i > 0) {
//     $results[i - 1]?.focus({ preventScroll: true });
//   } else {
//     $.input().focus();
//     gui.scrollResultsToTop();
//   }
//   gui.scrollActiveToCenter();
// };
// gui.focusNext = () => {
//   if (!gui.isOpen()) return;
//   const $results = $.results(),
//     i = $results.findIndex(($r) => $r === document.activeElement);
//   if (document.activeElement === $.input()) {
//     $results[0]?.focus({ preventScroll: true });
//   } else if (i > -1 && i < $results.length - 1) {
//     $results[i + 1]?.focus({ preventScroll: true });
//   } else {
//     $.input().focus();
//     gui.scrollResultsToTop();
//   }
//   gui.scrollActiveToCenter();
// };

// // deno-lint-ignore no-explicit-any
// const widgets: Record<string, (...args: any) => HTMLElement | string> = {};
// widgets.highlight = (str: string, query: string) => {
//   const caseInsensitive = `(${
//     safe(query).replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&")
//   })`;
//   return str.replace(
//     new RegExp(caseInsensitive, "ig"),
//     (match) => `<mark class="search-result-highlight">${match}</mark>`,
//   );
// };
// widgets.result = (result: SearchResult, query: string) => {
//   const icon = result.type === "page"
//     ? "file-text"
//     : (result.type === "heading" ? "hash" : "align-left");
//   const $result = html`<li>
//     <a href="${safe(result.url)}" class="search-result group">
//       ${featherIcons.icons[icon].toSvg({ class: "search-result-icon" })}
//       <div class="font-medium">
//         <p class="text-sm">${widgets.highlight(safe(result.text), query)}</p>
//         ${result.page ? `<p class="text-xs">${safe(result.page)}</p>` : ""}
//       </div>
//     </a>
//   </li>`;
//   $result.addEventListener("click", gui.close);
//   return $result;
// };
// widgets.section = (section: string, results: SearchResult[], query: string) => {
//   const $section = html`<ul>
//     <li class="search-result-section">${safe(section)}</li>
//   </ul>`;
//   for (const result of results) $section.append(widgets.result(result, query));
//   return $section;
// };

// export const initSearch = () => {
//   gui.clear();
//   gui.close();
//   fetchIndex().then(() => {
//     if (!(<HTMLInputElement> $.input()).value) search();
//   });

//   $.triggers().forEach(($t) => {
//     $t.removeEventListener("click", gui.open as EventListener);
//   });
//   $.triggers().forEach(($t) => {
//     $t.classList[$.showTrigger($t)]("sm:pointer-events-none", "sm:opacity-0");
//     $t.addEventListener("click", gui.open as EventListener);
//   });
//   $.close().removeEventListener("click", gui.close);
//   $.close().addEventListener("click", gui.close);
//   $.clear().removeEventListener("click", gui.clear);
//   $.clear().addEventListener("click", gui.clear);
//   $.input().removeEventListener("input", search);
//   $.input().addEventListener("input", search);

//   for (const hotkey of hotkeys) {
//     document.removeEventListener("keydown", hotkey);
//     document.addEventListener("keydown", hotkey);
//   }
// };
