import type { Matched, Targets } from "./types";
declare const rangesOf: (target: Targets, match: Matched | undefined) => Range[];
declare const highlight: (ranges: readonly Range[], name?: string) => () => void;
declare const highlightPage: ($root: Element, match: Matched | undefined, name?: string) => () => void;
declare const scrollToHighlight: (name?: string, { behavior, container, }?: {
    behavior?: ScrollBehavior;
    container?: Element | Window;
}) => boolean;
export { highlight, highlightPage, rangesOf, scrollToHighlight };
