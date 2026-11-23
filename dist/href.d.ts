import type { RecordMatch } from "./types";
declare const resolve: (href: string, base?: string) => string, fragmentOf: (href: string | undefined, base?: string, page?: string) => string | undefined, linkOf: (match: {
    href?: string;
    match?: RecordMatch["match"];
    matches: Record<string, unknown>;
}) => string;
export { fragmentOf, linkOf, resolve };
