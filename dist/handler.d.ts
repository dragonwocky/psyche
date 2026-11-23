import type { Request } from "./types";
declare const createHandler: <T extends Record<string, unknown> = Record<string, unknown>>() => (request: Request) => Promise<unknown>;
export { createHandler };
