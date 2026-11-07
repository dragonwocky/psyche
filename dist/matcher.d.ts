import { type MatchOptions } from "./fuzz";
import type { Fields, Linked, Match, Value } from "./match";
type FieldKey<T> = {
    [K in keyof T]-?: string extends K ? never : NonNullable<T[K]> extends Value ? K & string : never;
}[keyof T];
type TextMatch = {
    value: string;
    match?: string;
    score: number;
};
type RecordMatch<T extends Record<string, unknown> = Record<string, unknown>> = {
    value: T;
    match?: {
        key: string;
        index?: number;
    };
    matches: {
        [K in FieldKey<T>]?: NonNullable<T[K]> extends infer F extends Value ? Match<F> : never;
    };
    score: number;
};
type AnyMatch = (TextMatch | RecordMatch) & {
    href?: string;
};
type Options = MatchOptions & {
    fields?: Fields;
};
declare const isRecord: (value: unknown) => value is Record<string, unknown>, isLinked: (value: unknown) => value is Linked;
declare const matchValue: (query: string, value: unknown, options: Options, whole: boolean, nested: boolean) => AnyMatch | undefined, matchEntries: <T extends Record<string, unknown>>(query: string, entries: Linked<T>[], options: Options) => (RecordMatch<T> & {
    href: string;
})[];
export { type AnyMatch, type FieldKey, isLinked, isRecord, matchEntries, matchValue, type Options, type RecordMatch, type TextMatch, };
