import { afterEach, describe, expect, it, vi } from "vitest";

import { isShortcut, platformModifier } from "../src/keys";

const press = (key: string, init: Partial<KeyboardEvent> = {}) =>
  ({
    key,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...init,
  }) as KeyboardEvent;

describe("isShortcut", () => {
  it("requires exactly the given modifiers", () => {
    expect(isShortcut(press("k", { ctrlKey: true }), "k", { mod: true })).toBe(true);
    expect(isShortcut(press("K", { metaKey: true }), "k", { mod: true })).toBe(true);
    expect(isShortcut(press("k", { ctrlKey: true, shiftKey: true }), "k", { mod: true })).toBe(
      false,
    );
    expect(isShortcut(press("/"), "/")).toBe(true);
    expect(isShortcut(press("/", { altKey: true }), "/")).toBe(false);
  });
});

describe("platformModifier", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("labels cmd on apple platforms and ctrl elsewhere", () => {
    vi.stubGlobal("navigator", { platform: "MacIntel", userAgent: "" });
    expect(platformModifier()).toBe("⌘");
    vi.stubGlobal("navigator", { platform: "Win32", userAgent: "" });
    expect(platformModifier()).toBe("CTRL");
    vi.stubGlobal("navigator", {
      userAgentData: { platform: "macOS" },
      platform: "",
      userAgent: "",
    });
    expect(platformModifier()).toBe("⌘");
  });
});
