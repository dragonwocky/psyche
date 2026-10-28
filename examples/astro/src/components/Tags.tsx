import { highlight, rangesOf } from "psyche/highlight";
import { match } from "psyche/match";
import { useSearch } from "psyche/solid";
import { createEffect, For, onCleanup } from "solid-js";

import { search } from "../search";

// a page's tags, highlighted by its ?search= query, from the search's state
export default function Tags(props: { tags: string[] }) {
  const $tags: HTMLElement[] = [],
    state = useSearch(search);
  createEffect(() => onCleanup(highlight(rangesOf($tags, match(state().page.query, props.tags)))));
  return (
    <p class="tags">
      <For each={props.tags}>
        {(tag, i) => (
          <span ref={(el) => ($tags[i()] = el)} class="tag">
            {tag}
          </span>
        )}
      </For>
    </p>
  );
}
