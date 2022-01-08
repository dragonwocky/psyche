/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

import { flattenDict, isDict } from "../util.ts";
import { StyleDeclaration, StyleVariant } from "./config.ts";
import htm from "https://cdn.skypack.dev/htm";
import featherIcons from "https://cdn.skypack.dev/feather-icons";

const svgNamespace = "http://www.w3.org/2000/svg",
  svgElements = [
    "a",
    "animate",
    "animateMotion",
    "animateTransform",
    "circle",
    "clipPath",
    "defs",
    "desc",
    "discard",
    "ellipse",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feDropShadow",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "filter",
    "foreignObject",
    "g",
    "hatch",
    "hatchpath",
    "image",
    "line",
    "linearGradient",
    "marker",
    "mask",
    "metadata",
    "mpath",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "script",
    "set",
    "stop",
    "style",
    "svg",
    "switch",
    "symbol",
    "text",
    "textPath",
    "title",
    "tspan",
    "use",
    "view",
  ];

const normaliseProp = (prop: string) =>
    prop.replace(/([A-Z])/g, "-$1").toLowerCase(),
  h = (
    type: string,
    props: Record<string, unknown>,
    ...children: (string | Element)[]
  ): string | Element => {
    const $ = svgElements.includes(type)
      ? document.createElementNS(svgNamespace, type)
      : document.createElement(type);
    for (const [k, v] of Object.entries(props ?? {})) {
      if (["string", "number"].includes(typeof v)) {
        $.setAttribute(k, "" + v);
      } else if (typeof v === "function" && k.startsWith("on")) {
        const event = <keyof HTMLElementEventMap> k.slice(2);
        $.addEventListener(event, <EventListener> v);
      } else if (k === "style" && isDict(v)) {
        const styles = <Record<string, string>> v;
        for (const prop in styles) {
          $.style.setProperty(normaliseProp(prop), styles[prop]);
        }
      } else $.setAttribute(k, JSON.stringify(v));
    }
    $.append(...children);
    return $;
  };

export const safe = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;")
    .replace(/\\/g, "&#x5C;");

export const html: (s: unknown, ...args: unknown[]) => HTMLElement //
 = htm.bind(h);

export const css = (
  selector: string,
  { styles, themeMode = "class", $sheet }: {
    styles: StyleDeclaration;
    themeMode?: "class" | "media";
    $sheet: CSSStyleSheet;
  },
) => {
  const rules: {
    prefix: string;
    properties: Record<string, string>;
    suffix: string;
  }[] = [];
  for (const [variants, prop, value] of flattenDict(styles)) {
    const v = (v: StyleVariant) => variants.includes(v),
      mediaQueries: string[] = [];
    let rule = selector;
    if (v(":hover")) rule = `${rule}:hover`;
    if (v(":focus")) rule = `${rule}:focus`;
    if (v(":active")) rule = `${rule}:active`;
    if (v("::before")) rule = `${rule}::before`;
    if (v("::after")) rule = `${rule}::after`;
    if (v("::placeholder")) rule = `${rule}::placeholder`;
    if (themeMode === "class") {
      if (v(".light")) rule = `${rule}, :host-context(.light) ${rule}`;
      if (v(".dark")) rule = `:host-context(.dark) ${rule}`;
    } else if (themeMode === "media") {
      if (v(".light")) mediaQueries.push("(prefers-color-scheme: light)");
      if (v(".dark")) mediaQueries.push("(prefers-color-scheme: dark)");
    }
    if (v("<640px")) mediaQueries.push("(max-width: 640px)");
    const prefix = `${(mediaQueries.length
        ? `@media ${mediaQueries.join(" and ")} {`
        : "")}${rule}{`,
      suffix = mediaQueries.length
        ? "}}"
        : "}",
      index = rules.findIndex((rule) => rule.prefix === prefix);
    if (index > -1) {
      rules[index].properties = {
        ...rules[index].properties,
        [prop]: <string> value,
      };
    } else {
      rules.push({
        prefix,
        properties: { [prop]: <string> value },
        suffix,
      });
    }
  }
  for (const { prefix, properties, suffix } of rules) {
    let declaration = "";
    for (const prop in properties) {
      declaration += `${normaliseProp(prop)}: ${properties[prop]};`;
    }
    $sheet.insertRule(
      `${prefix} ${declaration} ${suffix}`,
      $sheet.cssRules.length,
    );
  }
};

export const feather = (icon: string) =>
  html([featherIcons.icons[icon].toSvg()]);
