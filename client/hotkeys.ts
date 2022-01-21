/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

// export const hotkeys = ()

// const hotkeys = [
//   // toggle
//   (event: KeyboardEvent) => {
//     const pressed = !event.shiftKey && !event.altKey &&
//       (event.metaKey || event.ctrlKey) && !(event.metaKey && event.ctrlKey) &&
//       event.key === "k";
//     if (pressed) {
//       event.preventDefault();
//       gui.toggle();
//     }
//   },
//   // navigation
//   (event: KeyboardEvent) => {
//     if (!gui.isOpen()) return;
//     if (event.key === "Escape") gui.close();
//     if (event.key === "ArrowUp") {
//       event.preventDefault();
//       gui.focusPrev();
//     }
//     if (event.key === "ArrowDown") {
//       event.preventDefault();
//       gui.focusNext();
//     }
//     if (event.key === "/" && document.activeElement !== $.input()) {
//       event.preventDefault();
//       $.input().focus();
//     }
//     if (event.key === "Enter" && document.activeElement === $.input()) {
//       gui.focusNext();
//       (<HTMLElement> document.activeElement)?.click();
//     }
//   },
// ];
