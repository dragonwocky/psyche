import {
  createSearch,
  highlight,
  isShortcut,
  platformModifier,
  rangesOf,
  type Result,
} from "psyche";

// the site's index records (see search.json.page.ts), and their fields by tier
type Page = { title: string; body: string; section?: string };
const search = createSearch<Page>({
  index: "/search.json",
  worker: "/search.worker.js",
  fields: [
    { key: "title", tier: 3 },
    { key: "body", tier: 1 },
  ],
  group: "section",
});

// the site's own panel, in plain DOM: rendered from the search's state, with
// its results' matches highlighted, and the selected result scrolled to
const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
) => {
  const $el = Object.assign(document.createElement(tag), props);
  $el.append(...children);
  return $el;
};
const $input = el("input", {
    type: "search",
    placeholder: "Search...",
    oninput: () => search.input($input.value),
  }),
  $results = el("div"),
  $legend = el("footer", {}, el("kbd", {}, `${platformModifier()} + K`), " to toggle search"),
  $panel = el(
    "div",
    { className: "search" },
    el("div", { className: "backdrop", onclick: search.close }),
    el("div", { className: "panel" }, $input, $results, $legend),
  );
$input.onkeydown = (event) => {
  if (!isShortcut(event, "Enter")) return;
  event.preventDefault();
  search.visit();
};
document.body.append($panel);

// each result's link, and the elements its fields are shown in, by its index
let $links: HTMLAnchorElement[] = [],
  targets: Record<string, Element>[] = [],
  removeHighlights = () => {};

const renderResult = (result: Result<Page>, index: number) => {
  const $title = el("strong", {}, result.matches.title?.value ?? ""),
    $body = el("p", {}, result.matches.body?.value ?? ""),
    $a = el(
      "a",
      {
        href: result.href,
        className: "result",
        onmouseover: () => search.select(index),
        onclick: (event) => {
          event.preventDefault();
          search.visit(index);
        },
      },
      $title,
      $body,
    );
  $links[index] = $a;
  targets[index] = { title: $title, body: $body };
  return $a;
};

// results are rendered again only when they change
let rendered: Result<Page>[] | undefined,
  wasOpen = false,
  selected = 0;
search.subscribe((state) => {
  $panel.classList.toggle("open", state.open);
  if (state.open && !wasOpen) $input.focus();
  wasOpen = state.open;
  const fresh = state.results !== rendered;
  if (fresh) {
    rendered = state.results;
    $links = [];
    targets = [];
    $results.replaceChildren(
      ...state.groups.map(({ group, results }) =>
        el(
          "section",
          {},
          ...(group ? [el("h2", {}, group)] : []),
          ...results.map(({ result, index }) => renderResult(result, index)),
        ),
      ),
    );
    removeHighlights();
    removeHighlights = highlight(
      state.results.flatMap((result, i) => rangesOf(targets[i], result)),
    );
  }
  $links.forEach(($a, i) => $a.classList.toggle("selected", i === state.selected));
  // by the keyboard, or as results change, not under the pointer that selected it
  const $selected = $links[state.selected];
  if ((fresh || state.selected !== selected) && $selected && !$selected.matches(":hover"))
    $selected.scrollIntoView({ block: "center" });
  selected = state.selected;
});
search.connect();
document.addEventListener("keydown", (event) => {
  if (!isShortcut(event, "k", { mod: true })) return;
  event.preventDefault();
  search.toggle();
});
document.querySelector("#search")?.addEventListener("click", search.open);
