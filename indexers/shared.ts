/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

// the slugify module comes with a builtin unicode
// charmap to handle special characters
import { slugify as internalSlugifier } from "https://deno.land/x/slugify@0.3.0/mod.ts";

const slugify = (
  str: string,
  cache: string[] = [],
): string => {
  // limit length, don't cut words in half
  str = str.slice(0, 32);
  if (str.includes(" ")) str = str.slice(0, str.lastIndexOf(" "));
  // prevent duplicate ids
  let duplicates = 0;
  const base = internalSlugifier(str, { lower: true }),
    computed = () => (duplicates ? `${base}-${duplicates}` : base);
  while (cache.some((slug) => slug === computed())) duplicates++;
  cache.push(computed());
  return computed();
};

export { slugify };
