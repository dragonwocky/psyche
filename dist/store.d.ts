import type { Options, State } from "./types";
declare const createSearch: <T extends Record<string, unknown> = Record<string, unknown>>(options: Options<T>) => {
    getState: () => State<T>;
    subscribe: (listener: (state: State<T>) => void) => () => undefined;
    open: () => void;
    close: () => void;
    input: (query: string) => void;
    select: (i: number) => void;
    visit: (i?: number) => string | undefined;
    load: (page: string) => Promise<void>;
};
export { createSearch };
