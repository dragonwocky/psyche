/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

// deno-lint-ignore no-explicit-any
export const platform = ((<any> navigator).userAgentData?.platform ??
  navigator.platform ?? navigator.userAgent).toLowerCase();

export const modifier =
  (platform.startsWith("mac") || platform.includes("darwin")) ? "⌘" : "CTRL";
