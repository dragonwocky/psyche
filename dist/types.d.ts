import type { createSearch } from "./store";
type Plain = string | Record<string, unknown>;
type Linked<P extends Plain = Plain> = {
    value: P;
    href: string;
};
type Value = Plain | Linked | readonly (Plain | Linked)[];
type FieldKey<T> = {
    [K in keyof T]-?: string extends K ? never : NonNullable<T[K]> extends Value ? K & string : never;
}[keyof T];
type Fields<T = Record<string, unknown>> = readonly {
    key: [FieldKey<T>] extends [never] ? string : FieldKey<T>;
    tier: number;
}[];
type Options<T extends Record<string, unknown> = Record<string, unknown>> = {
    fields: Fields<T>;
    limit?: number;
    length?: number;
    threshold?: number;
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
type OptionsOf<V extends Value> = [V] extends [
    string | Linked<string> | readonly (string | Linked<string>)[]
] ? [options?: Pick<Partial<Options>, "length" | "threshold">] : [options: Pick<Options, "fields" | "length" | "threshold">];
type Match<V extends Plain | Linked = Plain | Linked> = V extends Linked<infer P> ? Match<P> & {
    href: string;
} : V extends string ? {
    value: string;
    match?: string;
    score: number;
} : V extends Record<string, unknown> ? RecordMatch<V> : never;
type RecordMatch<T extends Record<string, unknown> = Record<string, unknown>> = {
    value: T;
    match?: {
        key: string;
        index?: number;
    };
    matches: {
        [K in FieldKey<T>]?: NonNullable<T[K]> extends readonly (infer I extends Plain | Linked)[] ? Match<I>[] : NonNullable<T[K]> extends infer F extends Plain | Linked ? Match<F> : never;
    };
    score: number;
};
type Matched = Match | readonly Match[] | {
    readonly [key: string]: Match | readonly Match[] | undefined;
};
type Result<T extends Record<string, unknown> = Record<string, unknown>> = Omit<RecordMatch<T>, "value"> & {
    value: Partial<T>;
    href: string;
};
type ResultGroup<T extends Record<string, unknown> = Record<string, unknown>> = {
    group?: string;
    results: {
        result: Result<T>;
        index: number;
    }[];
};
type State<T extends Record<string, unknown> = Record<string, unknown>> = {
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
type Store<T extends Record<string, unknown> = Record<string, unknown>> = ReturnType<typeof createSearch<T>>;
type Request = {
    type: "init";
    fields: Fields;
    options: Pick<Options, "index" | "limit" | "length" | "threshold">;
} | {
    type: "load";
} | {
    type: "search";
    query: string;
} | {
    type: "sitemap";
} | {
    type: "locate";
    query: string;
    href: string;
};
type Response<R extends Request, T extends Record<string, unknown> = Record<string, unknown>> = R extends {
    type: "search" | "sitemap";
} ? Result<T>[] : R extends {
    type: "locate";
} ? Result<T> | undefined : void;
type Target = Element | null | undefined;
type Targets = Target | readonly Target[] | {
    readonly [key: string]: Targets;
};
export type { FieldKey, Fields, Linked, Match, Matched, Options, OptionsOf, Plain, RecordMatch, Request, Response, Result, ResultGroup, State, Store, Target, Targets, Value, };
