/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

import featherIcons from "https://cdn.skypack.dev/feather-icons";

export const feather = (icon: string, cls = "") =>
  featherIcons.icons[icon].toSvg({ class: cls });

const raw = (
  s: TemplateStringsArray | string[],
  ...substitutions: unknown[]
) => {
  let raw = "";
  for (const str of s) raw += str + (substitutions.shift() ?? "");
  return raw.trim();
};

export const css = raw;
export const html = raw;

export const safe = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;")
    .replace(/\\/g, "&#x5C;");

export const render = (html: string) => {
  const $ = document.createRange().createContextualFragment(html);
  return $.children.length === 1 ? $.children[0] : $;
};
