import type { IndexOptions, Result } from "./handler";
import type { Fields, Linked } from "./match";
type SearchOptions<T extends Record<string, unknown> = Record<string, unknown>> = Omit<IndexOptions<T>, "index"> & {
    fields: Fields<T>;
    sitemap?: (result: Result<T>) => boolean;
    href?: (link: string, result: Omit<Result<T>, "href">, query: string) => string;
    group?: keyof T & string;
} & ({
    index: string | URL;
    worker?: string | URL;
    origin?: boolean;
} | {
    worker: false;
    index: string | URL | (() => Promise<Linked<T>[]>);
});
type ResultGroup<T extends Record<string, unknown> = Record<string, unknown>> = {
    group?: string;
    results: {
        result: Result<T>;
        index: number;
    }[];
};
type SearchState<T extends Record<string, unknown> = Record<string, unknown>> = {
    open: boolean;
    query: string;
    loading: boolean;
    results: Result<T>[];
    groups: ResultGroup<T>[];
    selected: number;
    page: {
        href?: string;
        query: string;
        located?: Result<T>;
    };
};
type SearchStore<T extends Record<string, unknown> = Record<string, unknown>> = ReturnType<typeof createSearch<T>>;
declare const createSearch: <T extends Record<string, unknown> = Record<string, unknown>>(options: SearchOptions<T>) => {
    getState: () => SearchState<T>;
    subscribe: (listener: (state: SearchState<T>) => void) => () => undefined;
    open: () => void;
    close: () => void;
    input: (query: string) => void;
    select: (i: number) => void;
    visit: (i?: number) => string | undefined;
    load: (page: string) => Promise<void>;
};
export { createSearch, type ResultGroup, type SearchOptions, type SearchState, type SearchStore };
