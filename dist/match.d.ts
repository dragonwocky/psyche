import type { MatchOptions } from "./fuzz";
import { type FieldKey, type RecordMatch, type TextMatch } from "./matcher";
type Plain = string | Record<string, unknown>;
type Linked<P extends Plain = Plain> = {
    value: P;
    href: string;
};
type Value = Plain | Linked | readonly (Plain | Linked)[];
type Match<V extends Value = Value> = V extends readonly (infer I extends Value)[] ? Match<I>[] : V extends Linked<infer P> ? Match<P> & {
    href: string;
} : V extends string ? TextMatch : V extends Record<string, unknown> ? RecordMatch<V> : never;
type Field<K extends string = string> = {
    key: K;
    tier: number;
};
type Fields<T = Record<string, unknown>> = [FieldKey<T>] extends [never] ? readonly Field[] : readonly Field<FieldKey<T>>[];
type Text = string | Linked<string>;
type OptionsOf<V extends Value> = [V] extends [Text | readonly Text[]] ? [options?: MatchOptions] : [options: MatchOptions & {
    fields: Fields;
}];
declare const match: <V extends Value>(query: string, input: V, ...[options]: OptionsOf<V>) => Match<V>;
declare const rank: <M extends {
    score: number;
}>(matches: readonly M[], limit?: number) => M[];
export { type Field, type Fields, type Linked, match, type Match, type MatchOptions, type Plain, rank, type Value, };
