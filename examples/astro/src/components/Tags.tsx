import { createHighlights, highlightItems } from "psyche/highlight";
import { matchItems } from "psyche/match";
import { For, onCleanup, onMount } from "solid-js";

// a page's tags, highlighted by its ?search= query: psyche announces it as
// psyche:match, and this island (which may hydrate later) asks for it again
export default function Tags(props: { tags: string[] }) {
  let $tags: HTMLElement | undefined;
  const highlight = createHighlights();
  onMount(() => {
    const onMatch = ({ detail }: CustomEvent<{ query: string }>) =>
      highlight(highlightItems($tags, matchItems(detail.query, props.tags)));
    document.addEventListener("psyche:match", onMatch);
    document.dispatchEvent(new Event("psyche:request"));
    onCleanup(() => {
      document.removeEventListener("psyche:match", onMatch);
      highlight([]);
    });
  });
  return (
    <p ref={$tags} class="tags">
      <For each={props.tags}>{(tag) => <span class="tag">{tag}</span>}</For>
    </p>
  );
}
