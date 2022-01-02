/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

import { createSlugifier } from "https://deno.land/x/lume@v1.4.1/plugins/slugify_urls.ts";

const slugifier = createSlugifier(),
  // hardcoded length limit
  max = 16;

export const slugify = (str: string, cache: string[] = []): string => {
  let duplicates = 0;
  const base = slugifier(str.slice(0, max)),
    computed = () => (duplicates ? `${base}-${duplicates}` : base);
  while (cache.some((slug) => slug === computed())) duplicates++;
  cache.push(computed());
  return computed();
};
