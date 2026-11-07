import type { Result } from "./handler";
import type { Fields, Linked, MatchOptions } from "./match";
import type { RecordMatch } from "./matcher";
type SearchOptions<T extends Record<string, unknown> = Record<string, unknown>> = MatchOptions & {
    fields: Fields<T>;
    limit?: number;
    sitemap?: (result: Result<T>) => boolean;
    href?: (link: string, result: Omit<Result<T>, "href">, query: string) => string;
    group?: keyof T & string;
    navigate?: (href: string, options: {
        sourceElement?: Element;
    }) => void;
    onOpen?: () => void;
    onLoad?: (page: SearchState<T>["page"]) => boolean | void;
    root?: string;
    loadEvent?: string;
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
        query: string;
        located?: RecordMatch<T> & {
            href: string;
        };
    };
};
declare const createSearch: <T extends Record<string, unknown> = Record<string, unknown>>(options: SearchOptions<T>) => {
    getState: () => SearchState<T>;
    subscribe: (listener: (state: SearchState<T>) => void) => () => undefined;
    open: () => void;
    close: () => void;
    toggle: () => void;
    input: (query: string) => void;
    select: (i: number) => void;
    selectPrevious: () => void;
    selectNext: () => void;
    visit: (i?: number) => void;
    connect: () => () => void;
    refs: {
        input: (el: HTMLInputElement) => void;
        result: (i: number) => (el: Element) => void;
        field: (i: number, key: Fields<T>[number]["key"], item?: number) => (el: Element) => void;
    };
};
type SearchStore<T extends Record<string, unknown> = Record<string, unknown>> = ReturnType<typeof createSearch<T>>;
export { createSearch, type ResultGroup, type SearchOptions, type SearchState, type SearchStore };
