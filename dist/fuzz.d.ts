declare const trim: (haystack: string, match?: [number, number], length?: number) => {
    haystack: string;
    match?: string;
};
declare const find: (needle: string, haystack: string) => {
    score: number;
    match: [number, number];
} | undefined;
export { find, trim };
