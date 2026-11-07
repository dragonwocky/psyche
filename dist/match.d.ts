import type { MatchOptions } from "./fuzz";
import { type FieldKey, type RecordMatch, type TextMatch } from "./matcher";
type Value = string | Record<string, unknown>;
type Linked<V extends Value = Value> = {
    value: V;
    href: string;
};
type Shape = Value | Linked | readonly (Value | Linked)[];
type Match<S extends Shape = Shape> = S extends readonly (infer I extends Shape)[] ? Match<I>[] : S extends Linked<infer V> ? Match<V> & {
    href: string;
} : S extends string ? TextMatch : S extends Record<string, unknown> ? RecordMatch<S> : never;
type Field<K extends string = string> = {
    key: K;
    tier: number;
};
type Fields<T = Record<string, unknown>> = [FieldKey<T>] extends [never] ? readonly Field[] : readonly Field<FieldKey<T>>[];
type Text = string | Linked<string>;
type OptionsOf<S extends Shape> = [S] extends [Text | readonly Text[]] ? [options?: MatchOptions] : [options: MatchOptions & {
    fields: Fields;
}];
declare const match: <S extends Shape>(query: string, input: S, ...[options]: OptionsOf<S>) => Match<S>;
declare const rank: <M extends {
    score: number;
}>(matches: readonly M[], limit?: number) => M[];
export { type Field, type Fields, type Linked, match, type Match, type MatchOptions, rank, type Shape, type Value, };
