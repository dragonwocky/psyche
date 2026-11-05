declare const resolve: (href: string, base?: string) => string, fragmentOf: (href: string | undefined, base?: string, page?: string) => string | undefined, linkOf: (match: {
    href?: string;
    match?: {
        key: string;
        index?: number;
    };
    matches: Record<string, unknown>;
}) => string;
export { fragmentOf, linkOf, resolve };
