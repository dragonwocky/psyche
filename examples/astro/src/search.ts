import { createSearch, type SearchState, type SearchStore } from "psyche";
import { type Accessor, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";

// the site's index records, and the fields searched in them, by tier
type Page = {
  title: string;
  body: string;
  headings?: { value: string; href: string }[];
  authors?: string[];
  categories?: string[];
  section?: string;
};

// one store, shared by the site's components: the panel, and tags on a page.
// it matches in psyche's own worker, which vite bundles from psyche
const search = createSearch<Page>({
  index: "/search.json",
  fields: [
    { key: "title", tier: 3 },
    { key: "headings", tier: 2.5 },
    { key: "authors", tier: 2 },
    { key: "categories", tier: 2 },
    { key: "body", tier: 1 },
  ],
  group: "section",
});

// the search's state as a solid store, for components that render from it: each
// field is merged in on change, so reading one only updates when its value does.
// on the server, components render its initial state, without subscribing
const useSearch = <T extends Record<string, unknown>>(
  search: SearchStore<T>,
): Accessor<SearchState<T>> => {
  if (isServer) return search.getState;
  // copied, as the store writes to the object it wraps
  const [state, setState] = createStore<SearchState<T>>({ ...search.getState() });
  onCleanup(search.subscribe((next) => setState(next)));
  return () => state;
};

export { type Page, search, useSearch };
