import { type Accessor, from } from "solid-js";
import { isServer } from "solid-js/web";

import type { PsycheRecord } from "./match";
import type { SearchState, SearchStore } from "./store";

// the search's state as a solid signal, for components that render from it.
// on the server, components render its initial state, without subscribing
const useSearch = <T extends PsycheRecord = PsycheRecord>(
  search: SearchStore<T>,
): Accessor<SearchState<T>> =>
  isServer
    ? search.getState
    : (from<SearchState<T>>(
        (set) => search.subscribe((state) => set(() => state)),
        search.getState(),
      ) as Accessor<SearchState<T>>);

export { useSearch };
