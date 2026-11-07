import { isShortcut, platformModifier } from "psyche";
import { For, onCleanup, onMount, Show } from "solid-js";

import { search, useSearch } from "../search";

// the site's own search panel, rendered from psyche's state: the elements
// psyche highlights matches in, and scrolls to, are handed to its refs
export default function Search() {
  const state = useSearch(search),
    { refs } = search;
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
  return (
    <div class="search" classList={{ open: state().open }}>
      <div class="backdrop" onClick={search.close} />
      <div class="panel">
        <div class="bar">
          <input
            ref={refs.input}
            type="search"
            placeholder="Search..."
            value={state().query}
            onInput={(event) => search.input(event.currentTarget.value)}
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
                {({ result, index }) => {
                  const heading = () =>
                    result.match?.key === "headings"
                      ? result.matches.headings?.[result.match.index!]
                      : undefined;
                  return (
                    <a
                      ref={refs.result(index)}
                      href={search.href(result)}
                      class="result"
                      classList={{ selected: state().selected === index }}
                      onMouseOver={() => search.select(index)}
                      onClick={(event) => {
                        event.preventDefault();
                        search.visit(index);
                      }}
                    >
                      <strong ref={refs.field(index, "title")}>
                        {result.matches.title?.value}
                      </strong>
                      <Show when={heading()}>
                        {(heading) => (
                          <em ref={refs.field(index, "headings", result.match!.index)}>
                            {" "}
                            › {heading().value}
                          </em>
                        )}
                      </Show>
                      <p ref={refs.field(index, "body")}>{result.matches.body?.value}</p>
                      <span>
                        <For each={result.matches.authors}>
                          {(tag, i) => (
                            <span ref={refs.field(index, "authors", i())} class="tag">
                              {tag.value}
                            </span>
                          )}
                        </For>
                        <For each={result.matches.categories}>
                          {(tag, i) => (
                            <span ref={refs.field(index, "categories", i())} class="tag">
                              {tag.value}
                            </span>
                          )}
                        </For>
                      </span>
                    </a>
                  );
                }}
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
