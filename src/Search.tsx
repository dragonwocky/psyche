import FileTextIcon from "lucide-solid/icons/file-text";
import HashIcon from "lucide-solid/icons/hash";
import SearchIcon from "lucide-solid/icons/search";
import XIcon from "lucide-solid/icons/x";
import { For, onMount, Show } from "solid-js";

import { type ClientOptions, createSearchClient, type SearchClient } from "./client";
import { LOGO } from "./logo";
import type { Ranking } from "./match";
import { createSearch, type SearchOptions } from "./search";
import { injectStyles } from "./styles";
import type { Result } from "./worker";

type SearchProps<Meta = unknown> = SearchOptions<Meta> & {
  // the site's search worker, or a client for it (e.g. to pass hooks
  // that an astro island's serialised props can't)
  worker?: string | URL;
  client?: SearchClient<Meta>;
  ranking?: ClientOptions<Meta>["ranking"];
  origin?: boolean;
  placeholder?: string;
  noResults?: string;
  // dark when an ancestor has the .dark class, or by the device
  darkMode?: "class" | "media";
};

// a result's list fields (e.g. authors and categories) as tags
const tags = (result: Result, ranking: Ranking) =>
  ranking
    .filter((field) => field.type === "list" && (field.element ?? field.key) === "tags")
    .flatMap((field) =>
      (((result as Record<string, unknown>)[field.key] as string[] | undefined) ?? []).map(
        (name) => ({
          field: field.key,
          name,
        }),
      ),
    );

// the default search panel, opened by mod+k or openSearch
export default function Search<Meta = unknown>(props: SearchProps<Meta>) {
  const client =
      props.client
      ?? createSearchClient<Meta>(props.worker ?? "/search.worker.js", {
        ranking: props.ranking,
        origin: props.origin,
      }),
    search = createSearch(client, {
      ...props,
      onOpen: () => {
        $panel?.animate(
          [{ transform: "scale(0.99)" }, { transform: "scale(1.01)" }, { transform: "scale(1)" }],
          { duration: 150, easing: "ease" },
        );
        props.onOpen?.();
      },
    });
  let $panel: HTMLDivElement | undefined;

  onMount(injectStyles);

  return (
    <div
      class="psyche"
      data-open={String(search.isOpen())}
      data-dark-mode={props.darkMode ?? "class"}
    >
      <div class="psyche-backdrop" onClick={search.close} />
      <div
        ref={(el) => ($panel = el)}
        class="psyche-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        aria-hidden={!search.isOpen()}
      >
        <label class="psyche-bar">
          <SearchIcon />
          <input
            ref={search.refs.input}
            class="psyche-input"
            type="search"
            name="search"
            autocomplete="off"
            placeholder={props.placeholder ?? "Search..."}
            aria-label={props.placeholder ?? "Search..."}
            value={search.query()}
            onInput={(event) => search.input(event.currentTarget.value)}
          />
          <Show when={search.query()}>
            <button
              type="button"
              class="psyche-clear"
              aria-label="Clear search"
              onClick={() => search.input("")}
            >
              <XIcon />
            </button>
          </Show>
          <span class="psyche-pills">
            <button
              type="button"
              class="psyche-pill"
              aria-label="Previous result"
              onClick={search.selectPrevious}
            >
              ↑
            </button>
            <button
              type="button"
              class="psyche-pill"
              aria-label="Next result"
              onClick={search.selectNext}
            >
              ↓
            </button>
            <button
              type="button"
              class="psyche-pill"
              aria-label="Close search"
              onClick={search.close}
            >
              Esc
            </button>
          </span>
        </label>
        <Show
          when={search.results().length}
          fallback={
            <Show when={search.query()}>
              <p class="psyche-empty">{props.noResults ?? "No results found."}</p>
            </Show>
          }
        >
          <div class="psyche-results" tabindex="-1">
            <For each={search.groups()}>
              {(group) => (
                <>
                  <Show when={group.section}>
                    <h2 class="psyche-section">{group.section}</h2>
                  </Show>
                  <For each={group.results}>
                    {({ result, index }) => (
                      <a
                        ref={search.refs.result(index)}
                        href={search.href(result)}
                        class="psyche-result"
                        data-selected={String(search.selected() === index)}
                        onMouseOver={() => search.setSelected(index)}
                        onFocus={() => search.setSelected(index)}
                        onClick={(event) => {
                          event.preventDefault();
                          search.visit(result, event.currentTarget);
                        }}
                      >
                        <Show when={result.date}>
                          <div class="psyche-date">{result.date}</div>
                        </Show>
                        <div class="psyche-row">
                          {result.heading ? <HashIcon /> : <FileTextIcon />}
                          <div>
                            <h3 class="psyche-title" data-psyche="title">
                              {result.match.title.text}
                            </h3>
                            <Show when={result.heading}>
                              {(heading) => (
                                <p class="psyche-heading" data-psyche="headings">
                                  {heading().text}
                                </p>
                              )}
                            </Show>
                            <p class="psyche-excerpt" data-psyche="body">
                              {result.match.body.text}
                            </p>
                            <Show when={tags(result as Result, client.ranking).length}>
                              <div class="psyche-tags" data-psyche="tags">
                                <For each={tags(result as Result, client.ranking)}>
                                  {(tag) => (
                                    <span class="psyche-tag" data-field={tag.field}>
                                      {tag.name}
                                    </span>
                                  )}
                                </For>
                              </div>
                            </Show>
                          </div>
                        </div>
                      </a>
                    )}
                  </For>
                </>
              )}
            </For>
          </div>
        </Show>
        <footer class="psyche-footer">
          <p>
            <kbd>{search.legend().kbd}</kbd> {search.legend().label}
          </p>
          <a class="psyche-brand" href="https://github.com/dragonwocky/psyche">
            Search by <span innerHTML={LOGO} style={{ display: "contents" }} /> psyche
          </a>
        </footer>
      </div>
    </div>
  );
}

export type { SearchProps };
