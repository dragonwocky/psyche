import { type MatchOptions } from "./fuzz";
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
type Match<V extends Plain | Linked = Plain | Linked> = V extends Linked<infer P> ? Match<P> & {
    href: string;
} : V extends string ? {
    value: string;
    match?: string;
    score: number;
} : V extends Record<string, unknown> ? RecordMatch<V> : never;
type Options = MatchOptions & {
    fields?: Fields;
};
type OptionsOf<V extends Value> = [V] extends [
    string | Linked<string> | readonly (string | Linked<string>)[]
] ? [options?: MatchOptions] : [options: MatchOptions & {
    fields: Fields;
}];
declare const matchRecord: <T extends Record<string, unknown>>(query: string, record: T, options: Options, nested?: boolean) => RecordMatch<T>;
declare const match: <V extends Value>(query: string, input: V, ...[options]: OptionsOf<V>) => V extends readonly (infer I extends Plain | Linked)[] ? Match<I>[] : V extends Plain | Linked ? Match<V> : never;
declare const rank: <M extends {
    score: number;
}>(matches: readonly M[], limit?: number) => M[];
export { type Fields, type Linked, match, type Match, matchRecord, rank, type RecordMatch, type Value, };
