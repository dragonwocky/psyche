import { type Accessor, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";

import type { SearchState, SearchStore } from "./store";

// the search's state as a solid store, for components that render from it: each
// field is merged in on change, so reading one only updates when its value does.
// on the server, components render its initial state, without subscribing
const useSearch = <T extends Record<string, unknown> = Record<string, unknown>>(
  search: SearchStore<T>,
): Accessor<SearchState<T>> => {
  if (isServer) return search.getState;
  // copied, as the store writes to the object it wraps
  const [state, setState] = createStore<SearchState<T>>({ ...search.getState() });
  onCleanup(search.subscribe((next) => setState(next)));
  return () => state;
};

export { useSearch };
