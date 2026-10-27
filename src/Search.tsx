import FileTextIcon from "lucide-solid/icons/file-text";
import HashIcon from "lucide-solid/icons/hash";
import SearchIcon from "lucide-solid/icons/search";
import XIcon from "lucide-solid/icons/x";
import { For, type JSX, Show } from "solid-js";

import { type ClientOptions, createSearchClient, type SearchClient } from "./client";
import type { Ranking } from "./match";
import { createSearch, type SearchOptions } from "./search";
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
};

// styled as template-cms' search panel, with psyche's palette (see theme.css)
// and without relying on tailwind's preflight, which psyche's styles.css leaves out,
// and the site's dark: variant, or a .dark class in psyche's own styles.css:
// classes are complete strings, for tailwind to find in psyche's build
const FOCUS_RING =
    "outline-none focus-visible:ring-2 focus-visible:ring-psyche-accent-600 dark:focus-visible:ring-psyche-accent-200",
  ACCENT =
    "bg-psyche-accent-100 text-psyche-accent-600 dark:bg-psyche-accent-700 dark:text-psyche-accent-200";

// a key, as a pill
function Pill(props: { "aria-label": string; "onClick": () => void; "children": JSX.Element }) {
  return (
    <kbd>
      <button
        type="button"
        aria-label={props["aria-label"]}
        onClick={props.onClick}
        class={[
          "rounded-full text-nowrap text-xs font-bold px-2.5 py-1",
          "inline-flex flex-row items-center select-none cursor-pointer border-0 font-sans",
          FOCUS_RING,
          ACCENT,
        ].join(" ")}
      >
        {props.children}
      </button>
    </kbd>
  );
}

// a result's list fields (e.g. authors then categories) as tags, the first accented
const tags = (result: Result, ranking: Ranking) =>
  ranking
    .filter((field) => field.type === "list" && (field.element ?? field.key) === "tags")
    .flatMap((field, i) =>
      (((result as Record<string, unknown>)[field.key] as string[] | undefined) ?? []).map(
        (name) => ({ field: field.key, name, accent: !i }),
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

  return (
    <div
      class="psyche z-100 fixed flex inset-0 justify-center font-sans text-psyche-ghost-600 dark:text-psyche-ghost-300"
      classList={{ "pointer-events-none": !search.isOpen() }}
      data-open={String(search.isOpen())}
    >
      <div
        class="absolute inset-0 w-full h-full bg-black/60 transition-opacity"
        classList={{ "opacity-0": !search.isOpen() }}
        onClick={search.close}
      />
      <div
        ref={(el) => ($panel = el)}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        aria-hidden={!search.isOpen()}
        class={[
          "z-10 w-full max-w-3xl mx-6 sm:mx-12 md:mx-16 flex flex-col",
          "inset-shadow-sm dark:shadow-lg overflow-clip rounded-2xl transition-opacity",
          "bg-psyche-ghost-200 dark:bg-psyche-ghost-700 dark:border dark:border-current/20",
          "mt-6 sm:mt-12 mb-auto md:mt-[20vh]",
          "max-h-[calc(100vh-(--spacing(12)))] sm:max-h-[calc(100vh-(--spacing(24)))] md:max-h-[60vh]",
        ].join(" ")}
        classList={{ "opacity-0": !search.isOpen() }}
      >
        <label
          class={[
            "m-2 flex items-center pl-5 pr-3.5 *:[svg]:h-4 *:[svg]:shrink-0",
            "transition-shadow ring ring-current/20 focus-within:ring-2 rounded-xl",
            "focus-within:ring-psyche-accent-600 dark:focus-within:ring-psyche-accent-200",
            "*:[svg]:transition-opacity not-focus-within:*:[svg]:opacity-60",
          ].join(" ")}
        >
          <SearchIcon />
          <input
            ref={search.refs.input}
            type="search"
            name="search"
            autocomplete="off"
            placeholder={props.placeholder ?? "Search..."}
            aria-label={props.placeholder ?? "Search..."}
            value={search.query()}
            onInput={(event) => search.input(event.currentTarget.value)}
            class={[
              "w-full text-base pl-6 pr-4 py-4 min-w-0 border-0 bg-transparent text-current font-[inherit] outline-0 appearance-none placeholder:text-current/60",
              "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:[-webkit-appearance:none]",
            ].join(" ")}
          />
          <Show when={search.query()}>
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => search.input("")}
              class={`inline-flex items-center justify-center cursor-pointer rounded-sm shrink-0 p-1 mr-1 opacity-60 border-0 bg-transparent text-current ${FOCUS_RING}`}
            >
              <XIcon class="size-4" />
            </button>
          </Show>
          <span class="hidden sm:inline-flex gap-1">
            <Pill aria-label="Previous result" onClick={search.selectPrevious}>
              ↑
            </Pill>
            <Pill aria-label="Next result" onClick={search.selectNext}>
              ↓
            </Pill>
            <Pill aria-label="Close search" onClick={search.close}>
              Esc
            </Pill>
          </span>
        </label>
        <Show
          when={search.results().length}
          fallback={
            <Show when={search.query()}>
              <p class="px-8 pt-2 pb-4 text-sm text-current/60">
                {props.noResults ?? "No results found."}
              </p>
            </Show>
          }
        >
          <div
            tabindex="-1"
            class="flex flex-col gap-2 min-h-0 overflow-y-auto px-2 pt-2 pb-2.5 no-underline"
          >
            <For each={search.groups()}>
              {(group) => (
                <>
                  <Show when={group.section}>
                    <h2 class="m-0 px-6 pt-2 text-xs font-bold text-psyche-accent-600 dark:text-psyche-accent-200">
                      {group.section}
                    </h2>
                  </Show>
                  <For each={group.results}>
                    {({ result, index }) => (
                      <a
                        ref={search.refs.result(index)}
                        href={search.href(result)}
                        class="px-6 py-4 rounded-xl outline-0 text-inherit no-underline"
                        classList={{
                          "bg-psyche-ghost-400/60 dark:bg-psyche-ghost-500":
                            search.selected() === index,
                        }}
                        data-selected={String(search.selected() === index)}
                        onMouseOver={() => search.setSelected(index)}
                        onFocus={() => search.setSelected(index)}
                        onClick={(event) => {
                          event.preventDefault();
                          search.visit(result, event.currentTarget);
                        }}
                      >
                        <Show when={result.date}>
                          <div class="mb-2 text-xs text-current/60">{result.date}</div>
                        </Show>
                        <div class="flex gap-5.5">
                          <span class="mt-0.5 text-current/60 *:[svg]:size-5">
                            {result.heading ? <HashIcon /> : <FileTextIcon />}
                          </span>
                          <div class="min-w-0 *:empty:hidden">
                            <h3
                              data-psyche="title"
                              class="m-0 text-base font-serif font-bold tracking-tight"
                            >
                              {result.match.title.text}
                            </h3>
                            <Show when={result.heading}>
                              {(heading) => (
                                <p data-psyche="headings" class="m-0 text-sm font-semibold">
                                  {heading().text}
                                </p>
                              )}
                            </Show>
                            <p
                              data-psyche="body"
                              class="m-0 text-sm text-current/60 line-clamp-2 whitespace-pre-line"
                            >
                              {result.match.body.text}
                            </p>
                            <Show when={tags(result as Result, client.ranking).length}>
                              <div data-psyche="tags" class="mt-2 flex flex-wrap gap-2">
                                <For each={tags(result as Result, client.ranking)}>
                                  {(tag) => (
                                    <span
                                      data-field={tag.field}
                                      class={[
                                        "rounded-lg text-nowrap text-xs font-medium px-2.5",
                                        "inline-flex flex-row items-center py-1 select-none",
                                        tag.accent ? ACCENT : "bg-current/10",
                                      ].join(" ")}
                                    >
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
        <footer class="flex items-center justify-between gap-4 px-4 py-2.5 text-xs text-current/60 border-t border-current/20">
          <p class="m-0">
            <kbd
              class={`mr-1 rounded-full font-sans font-bold px-2.5 py-1 text-current bg-psyche-ghost-100 dark:bg-psyche-ghost-800 inset-ring inset-ring-current/20`}
            >
              {search.legend().kbd}
            </kbd>{" "}
            {search.legend().label}
          </p>
          <a
            href="https://github.com/dragonwocky/psyche"
            class={`rounded-sm text-nowrap no-underline text-psyche-accent-600 dark:text-psyche-accent-200 ${FOCUS_RING}`}
          >
            Search by psyche
          </a>
        </footer>
      </div>
    </div>
  );
}

export type { SearchProps };
