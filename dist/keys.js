// src/keys.ts
var isShortcut = (event, key, modifiers = {}) => event.key.toLowerCase() === key.toLowerCase() && (event.metaKey || event.ctrlKey) === !!modifiers.mod && event.shiftKey === !!modifiers.shift && event.altKey === !!modifiers.alt;
var platform = () => (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent).toLowerCase();
var platformModifier = () => platform().startsWith("mac") || platform().includes("darwin") || /iphone|ipad/.test(platform()) ? "⌘" : "CTRL";
export { isShortcut, platformModifier };

//# sourceMappingURL=keys.js.map