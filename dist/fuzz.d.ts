type Excerpt = {
    text: string;
    match?: string;
};
type MatchOptions = {
    excerpt?: number;
    threshold?: number;
};
declare const sanitise: (str?: string) => string;
declare const fuzz: (needle: string, haystack: string, threshold?: number) => [number, number, number], balance: ([fscore, f0, f1]: [number, number, number], haystack: string, { excerpt }?: MatchOptions) => Excerpt;
export { balance, type Excerpt, fuzz, type MatchOptions, sanitise };
