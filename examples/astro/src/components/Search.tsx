import { highlight, isShortcut, platformModifier, rangesOf, type SearchState } from "psyche";
import { createEffect, For, onCleanup, onMount, Show } from "solid-js";

import { type Page, search, useSearch } from "../search";

// the site's own search panel, rendered from psyche's state: it focuses its
// input, highlights its results' matches, and scrolls to the selected one
export default function Search() {
  let $input!: HTMLInputElement;
  const state = useSearch(search);
  onMount(() => {
    // the shortcut that toggles the search, alongside psyche's own once it's open
    const onKeydown = (event: KeyboardEvent) => {
      if (!isShortcut(event, "k", { mod: true })) return;
      event.preventDefault();
      search.toggle();
    };
    document.addEventListener("keydown", onKeydown);
    onCleanup(() => document.removeEventListener("keydown", onKeydown));
    onCleanup(search.connect());
  });
  createEffect(() => state().open && $input.focus());
  return (
    <div class="search" classList={{ open: state().open }}>
      <div class="backdrop" onClick={search.close} />
      <div class="panel">
        <div class="bar">
          <input
            ref={$input}
            type="search"
            placeholder="Search..."
            value={state().query}
            onInput={(event) => search.input(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (!isShortcut(event, "Enter")) return;
              event.preventDefault();
              search.visit();
            }}
          />
          <button type="button" aria-label="Previous result" onClick={search.selectPrevious}>
            ↑
          </button>
          <button type="button" aria-label="Next result" onClick={search.selectNext}>
            ↓
          </button>
          <button type="button" aria-label="Close search" onClick={search.close}>
            Esc
          </button>
        </div>
        <For each={state().groups}>
          {(group) => (
            <section>
              <Show when={group.group}>
                <h2>{group.group}</h2>
              </Show>
              <For each={group.results}>
                {({ result, index }) => (
                  <SearchResult
                    result={result}
                    index={index}
                    selected={state().selected === index}
                  />
                )}
              </For>
            </section>
          )}
        </For>
        <footer>
          <span>
            <kbd>{platformModifier()} + K</kbd> to toggle search
          </span>
          <span class="brand">Search by psyche</span>
        </footer>
      </div>
    </div>
  );
}

// a result, highlighting its matches in the elements it shows them in, and
// scrolled to as it's selected by the keyboard (not as the pointer selects it)
function SearchResult(props: {
  result: SearchState<Page>["results"][number];
  index: number;
  selected: boolean;
}) {
  let $a!: HTMLAnchorElement,
    $title!: HTMLElement,
    $body!: HTMLElement,
    $heading: HTMLElement | undefined;
  const $authors: HTMLElement[] = [],
    $categories: HTMLElement[] = [],
    heading = () =>
      props.result.match?.key === "headings"
        ? props.result.matches.headings?.[props.result.match.index!]
        : undefined;
  createEffect(() => {
    const headings: HTMLElement[] = [];
    if (heading() && $heading) headings[props.result.match!.index!] = $heading;
    const targets = {
      title: $title,
      headings,
      body: $body,
      authors: $authors,
      categories: $categories,
    };
    onCleanup(highlight(rangesOf(targets, props.result)));
  });
  createEffect(
    () => props.selected && !$a.matches(":hover") && $a.scrollIntoView({ block: "center" }),
  );
  return (
    <a
      ref={$a}
      href={props.result.href}
      class="result"
      classList={{ selected: props.selected }}
      onMouseOver={() => search.select(props.index)}
      onClick={(event) => {
        event.preventDefault();
        search.visit(props.index);
      }}
    >
      <strong ref={$title}>{props.result.matches.title?.value}</strong>
      <Show when={heading()}>{(heading) => <em ref={$heading}> › {heading().value}</em>}</Show>
      <p ref={$body}>{props.result.matches.body?.value}</p>
      <span>
        <For each={props.result.matches.authors}>
          {(tag, i) => (
            <span ref={(el) => ($authors[i()] = el)} class="tag">
              {tag.value}
            </span>
          )}
        </For>
        <For each={props.result.matches.categories}>
          {(tag, i) => (
            <span ref={(el) => ($categories[i()] = el)} class="tag">
              {tag.value}
            </span>
          )}
        </For>
      </span>
    </a>
  );
}
