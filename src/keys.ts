// with exactly these modifiers, where mod is ctrl or cmd
const isShortcut = (
  event: KeyboardEvent,
  key: string,
  modifiers: { mod?: boolean; shift?: boolean; alt?: boolean } = {},
) =>
  event.key.toLowerCase() === key.toLowerCase()
  && (event.metaKey || event.ctrlKey) === !!modifiers.mod
  && event.shiftKey === !!modifiers.shift
  && event.altKey === !!modifiers.alt;

// userAgentData is chromium only, so others fall back to the deprecated platform
const platform = () =>
    (
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform
      || navigator.platform
      || navigator.userAgent
    ).toLowerCase(),
  platformModifier = () =>
    platform().startsWith("mac") || platform().includes("darwin") || /iphone|ipad/.test(platform())
      ? "⌘"
      : "CTRL";

export { isShortcut, platformModifier };
