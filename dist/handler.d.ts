import { type Fields, type Linked, type MatchOptions } from "./match";
import { type RecordMatch } from "./matcher";
type Result<T extends Record<string, unknown> = Record<string, unknown>> = Omit<RecordMatch<T>, "value" | "href"> & {
    value: Partial<T>;
    href: string;
};
type IndexOptions<T extends Record<string, unknown> = Record<string, unknown>> = MatchOptions & {
    index: string | (() => Promise<Linked<T>[]>);
    limit?: number;
};
type Request = {
    type: "init";
    fields: Fields;
    options: IndexOptions;
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
} ? (RecordMatch<T> & {
    href: string;
}) | undefined : void;
declare const createHandler: <T extends Record<string, unknown> = Record<string, unknown>>() => (request: Request) => Promise<unknown>;
export { createHandler, type IndexOptions, type Request, type Response, type Result };
