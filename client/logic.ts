/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

import type { Result } from "../types.d.ts";
import FuzzySet from "https://cdn.skypack.dev/fuzzyset.js";

const _history: WeakMap<Result[], {
  queries: string[];
  results: Map<string, Result[]>;
}> = new WeakMap();

const fuzzy = (index: Result[], query: string) => {
  const matches: { result: Result; score: number }[] = [];
  for (const result of index) {
    const set = FuzzySet();
    set.add(result.content.toLowerCase());
    matches.push({ result, score: set.get(query, [[0]])[0][0] });
  }
  // sort by relevance: highest at top
  const sorted = matches.sort((a, b) => b.score - a.score)
    .filter((match) => match.score)
    .map((match) => match.result);
  return sorted;
};

const search = (index: Result[], query: string) => {
  query = query.trim().toLowerCase();
  if (!_history.has(index)) {
    _history.set(index, { queries: [], results: new Map() });
  }
  const cache = _history.get(index)!;
  if (!cache.results.has(query)) {
    if (query.length === 0) {
      // empty query: return sitemap
      const matches = index.filter((result) => result.type === "page");
      cache.results.set(query, matches);
    } else {
      // perf. improvement by using narrower sets from prev searches
      const prevIndex = cache.queries.findIndex((q) => query.startsWith(q)),
        narrow = prevIndex > -1
          ? cache.results.get(cache.queries[prevIndex])!
          : index,
        exact = narrow
          .filter((result) => result.content.toLowerCase().includes(query)),
        approximate = fuzzy(narrow, query)
          .filter((result) => !exact.includes(result));

      console.log(cache.queries, prevIndex, cache.queries[prevIndex], narrow);
      cache.results.set(query, [...exact, ...approximate]);
      cache.queries.splice(prevIndex > 0 ? prevIndex - 1 : 0, 0, query);
    }
  }
  return cache.results.get(query)!;
};

const group = (results: Result[]) => {
  const grouped = results.reduce((groups, result) => {
    if (!groups[result.section]) groups[result.section] = [];
    groups[result.section].push(result);
    return groups;
  }, {} as Record<string, Result[]>);
  return grouped;
};

export { group, search };
