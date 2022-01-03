/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

import { default as slugifier } from "https://cdn.skypack.dev/slugify";

export const slugify = (
  str: string,
  cache: string[] = [],
): string => {
  str = str.slice(0, 32);
  str = str.slice(0, str.lastIndexOf(" "));
  let duplicates = 0;
  const base = slugifier(str, { lower: true }),
    computed = () => (duplicates ? `${base}-${duplicates}` : base);
  while (cache.some((slug) => slug === computed())) duplicates++;
  cache.push(computed());
  return computed();
};

export const isDict = <Type>(
  value: Type,
): value is Type & Record<string, unknown> =>
  (<Record<string, unknown>> value).constructor === Object;

export const methodInclusiveStructuredClone = <Type>(value: Type) => {
  // structured clone can't serialise functions
  // this handles cloning of dict methods:
  // it does not handle cloning of functions
  // within other objects e.g. arrays
  if (isDict(value)) {
    const clone: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (isDict(v)) {
        clone[k] = methodInclusiveStructuredClone(v);
      } else if (typeof v === "function") {
        clone[k] = v;
      } else clone[k] = structuredClone(v);
    }
    return clone;
  } else return structuredClone(value);
};

export const merge = <Type>(
  source: Type,
  target: Partial<Type>,
  clone = true,
) => {
  if (isDict(source) && isDict(target)) {
    if (clone) {
      source = methodInclusiveStructuredClone(source);
      target = methodInclusiveStructuredClone(target);
    }
    for (const [k, v] of Object.entries(source)) {
      // @ts-ignore: objects can be indexed by their own keys
      if (target[k] && v && typeof v === "object") {
        // @ts-ignore (see above)
        merge(v, target[k], false);
        // @ts-ignore (see above)
      } else target[k] = v;
    }
  }
  return target;
};
