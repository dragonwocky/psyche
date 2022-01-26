/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

// dom

import featherIcons from "https://cdn.skypack.dev/feather-icons";

const feather = (icon: string, cls = "") =>
  featherIcons.icons[icon].toSvg({ class: cls });

const raw = (
    s: TemplateStringsArray | string[],
    ...substitutions: unknown[]
  ) => {
    let raw = "";
    for (const str of s) raw += str + (substitutions.shift() ?? "");
    return raw.trim();
  },
  css = raw,
  html = raw;

const safe = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;")
    .replace(/\\/g, "&#x5C;");

const render = (html: string) => {
  const $ = document.createRange().createContextualFragment(html);
  return $.children.length === 1 ? $.children[0] : $;
};

// platform

// deno-lint-ignore no-explicit-any
const platform = ((<any> navigator).userAgentData?.platform ??
    navigator.platform ?? navigator.userAgent).toLowerCase(),
  isMac = platform.startsWith("mac") || platform.includes("darwin");

export { css, feather, html, isMac, platform, render, safe };
