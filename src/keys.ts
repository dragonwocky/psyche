// whether a key was pressed with exactly the given modifiers,
// where mod is ctrl, or cmd on macs, e.g. isShortcut(event, "k", { mod: true })
const isShortcut = (
  event: KeyboardEvent,
  key: string,
  modifiers: { mod?: boolean; shift?: boolean; alt?: boolean } = {},
) =>
  event.key.toLowerCase() === key.toLowerCase()
  && (event.metaKey || event.ctrlKey) === !!modifiers.mod
  && event.shiftKey === !!modifiers.shift
  && event.altKey === !!modifiers.alt;

// the mod key's label: userAgentData is chromium only, so
// other browsers fall back to the deprecated (but present) platform
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
