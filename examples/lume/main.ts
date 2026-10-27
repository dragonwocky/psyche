import { createSearch, type Result } from "psyche";

// the site's index records (see search.json.page.ts), and their fields by tier
type Page = { href: string; title: string; body: string; section?: string };
const search = createSearch<Page>({
  worker: "/search.worker.js",
  fields: [
    { key: "title", tier: 3 },
    { key: "body", tier: 1 },
  ],
  group: "section",
});

// the site's own panel, in plain DOM: rendered from the search's state, with
// the elements psyche highlights matches in, and scrolls to, handed to its refs
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
  $legend = el("footer", {}, el("kbd", {}, search.legend().kbd), ` ${search.legend().label}`),
  $panel = el(
    "div",
    { className: "search" },
    el("div", { className: "backdrop", onclick: search.close }),
    el("div", { className: "panel" }, $input, $results, $legend),
  );
search.refs.input($input);
document.body.append($panel);

const renderResult = (result: Result<Page>, index: number) => {
  const $title = el("strong", {}, result.match.title?.text ?? ""),
    $body = el("p", {}, result.match.body?.text ?? ""),
    $a = el(
      "a",
      {
        href: search.href(result),
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
  search.refs.result(index)($a);
  search.refs.field(index, "title")($title);
  search.refs.field(index, "body")($body);
  return $a;
};

// results are rendered again only when they change
let rendered: Result<Page>[] | undefined;
search.subscribe((state) => {
  $panel.classList.toggle("open", state.open);
  if (state.results !== rendered) {
    rendered = state.results;
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
  }
  $results
    .querySelectorAll(".result")
    .forEach(($a, i) => $a.classList.toggle("selected", i === state.selected));
});
search.connect();
document.querySelector("#search")?.addEventListener("click", search.open);
