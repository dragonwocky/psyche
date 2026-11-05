declare const isShortcut: (event: KeyboardEvent, key: string, modifiers?: {
    mod?: boolean;
    shift?: boolean;
    alt?: boolean;
}) => boolean;
declare const platformModifier: () => "CTRL" | "⌘";
export { isShortcut, platformModifier };
