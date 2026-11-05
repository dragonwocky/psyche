import type { AnyMatch as Matched } from "./matcher";
type Target = Element | null | undefined;
type Targets = Target | readonly Target[] | {
    readonly [key: string]: Targets;
};
type AnyMatch = Matched | readonly AnyMatch[] | {
    readonly [key: string]: AnyMatch | undefined;
};
declare const rangesOf: (target: Targets, match: AnyMatch | undefined) => Range[];
declare const highlight: (ranges: readonly Range[], name?: string) => () => void;
export { highlight, rangesOf };
