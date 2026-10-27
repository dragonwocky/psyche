import { type Accessor, from } from "solid-js";

import type { PsycheRecord } from "./match";
import type { SearchState, SearchStore } from "./store";

// the search's state as a solid signal, for components that render from it
const useSearch = <T extends PsycheRecord = PsycheRecord>(
  search: SearchStore<T>,
): Accessor<SearchState<T>> =>
  from<SearchState<T>>(
    (set) => search.subscribe((state) => set(() => state)),
    search.getState(),
  ) as Accessor<SearchState<T>>;

export { useSearch };
