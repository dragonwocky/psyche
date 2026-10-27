import { createSearch, createSearchClient } from "psyche";
import { For, Show } from "solid-js";

import workerUrl from "../search.worker?worker&url";

// the site's own search panel markup, with psyche's state: fields to highlight
// are marked by data-psyche, and tags are the children of data-psyche="tags"
export default function Search() {
  const search = createSearch(createSearchClient(workerUrl));
  return (
    <div class="search" data-open={String(search.isOpen())}>
      <div class="backdrop" onClick={search.close} />
      <div class="panel">
        <div class="bar">
          <input
            ref={search.refs.input}
            type="search"
            placeholder="Search..."
            value={search.query()}
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
        <For each={search.groups()}>
          {(group) => (
            <section>
              <Show when={group.section}>
                <h2>{group.section}</h2>
              </Show>
              <For each={group.results}>
                {({ result, index }) => (
                  <a
                    ref={search.refs.result(index)}
                    href={search.href(result)}
                    class="result"
                    data-selected={String(search.selected() === index)}
                    onMouseOver={() => search.setSelected(index)}
                    onClick={(event) => {
                      event.preventDefault();
                      search.visit(result, event.currentTarget);
                    }}
                  >
                    <strong data-psyche="title">{result.match.title.text}</strong>
                    <Show when={result.heading}>
                      {(heading) => <em data-psyche="headings"> › {heading().text}</em>}
                    </Show>
                    <p data-psyche="body">{result.match.body.text}</p>
                    <span data-psyche="tags">
                      <For each={[...(result.authors ?? []), ...(result.categories ?? [])]}>
                        {(tag) => <span class="tag">{tag}</span>}
                      </For>
                    </span>
                  </a>
                )}
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
