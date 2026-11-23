import type { Linked, Match, Options, OptionsOf, Plain, RecordMatch, Value } from "./types";
declare const matchRecord: <T extends Record<string, unknown>>(query: string, record: T, options: Pick<Partial<Options>, "fields" | "length" | "threshold">, nested?: boolean) => RecordMatch<T>;
declare const match: <V extends Value>(query: string, input: V, ...[options]: OptionsOf<V>) => V extends readonly (infer I extends Plain | Linked)[] ? Match<I>[] : V extends Plain | Linked ? Match<V> : never;
declare const rank: <M extends {
    score: number;
}>(matches: readonly M[], limit?: number) => M[];
export { match, matchRecord, rank };
