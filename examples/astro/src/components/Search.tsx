import { useSearch } from "psyche/solid";
import { For, onCleanup, onMount, Show } from "solid-js";

import { search } from "../search";

// the site's own search panel, rendered from psyche's state: the elements
// psyche highlights matches in, and scrolls to, are handed to its refs
export default function Search() {
  const state = useSearch(search),
    { refs } = search;
  onMount(() => onCleanup(search.connect()));
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
                    result.match.best?.key === "headings"
                      ? result.match.headings?.[result.match.best.index!]
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
                      <strong ref={refs.field(index, "title")}>{result.match.title?.text}</strong>
                      <Show when={heading()}>
                        {(heading) => (
                          <em ref={refs.field(index, "headings", result.match.best!.index)}>
                            {" "}
                            › {heading().text}
                          </em>
                        )}
                      </Show>
                      <p ref={refs.field(index, "body")}>{result.match.body?.text}</p>
                      <span>
                        <For each={result.match.authors}>
                          {(tag, i) => (
                            <span ref={refs.field(index, "authors", i())} class="tag">
                              {tag.text}
                            </span>
                          )}
                        </For>
                        <For each={result.match.categories}>
                          {(tag, i) => (
                            <span ref={refs.field(index, "categories", i())} class="tag">
                              {tag.text}
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
            <kbd>{search.legend().kbd}</kbd> {search.legend().label}
          </span>
          <span class="brand">Search by psyche</span>
        </footer>
      </div>
    </div>
  );
}
