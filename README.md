# 🧠 psyche

**psyche** is a fast, typo-tolerant, headless search for static and
server-rendered sites.

Results are fuzzy matched in a web worker, using a search algorithm
loosely based on [fuzzysearch](https://github.com/bevacqua/fuzzysearch).

## Install

```sh
pnpm add github:dragonwocky/psyche#semver:^1.1.0
```

## The index

The index is a JSON array of records, served by your site, each linked to its
page: `{ href, value: record }`. A record's values are yours: the fields you
search, and anything else you want in results, which is passed through to them
untouched.

```ts
const entry = {
  href: "/posts/kale/",
  value: {
    title: "Growing kale",
    body: "Sow kale in late summer…", // the page's text
    headings: [{ value: "After a frost", href: "#frost" }], // a match in one links to it
    tags: ["Vegetables"],
    date: "27 October 2026", // not searched: passed through as data
  },
};
```

A searched value is text, or a record, matched by the same fields (e.g. an
author's `name`). Either can be linked, `{ value, href }`, with a link relative
to the link of the record it's in: a result whose best match is in a linked
value links to it, e.g. a heading's `#id`. A field's value is plain or linked,
or an array of them:

```ts
type Plain = string | Record<string, unknown>;
type Linked = { value: Plain; href: string }; // only these two keys
type Value = Plain | Linked | (Plain | Linked)[];

const post = {
  title: "Growing kale",
  authors: [{ value: { name: "Alice" }, href: "/authors/alice" }], // fields: [..., { key: "name", tier: 0 }]
};
```

A record in a field scores its best value's match, without tiers, plus its
field's tier: an author's name matching outranks the body, as `authors` does,
whatever `name`'s tier.

## The worker

Matching runs in psyche's own worker, which the store starts the first time
search is used, and which fetches the index then. Vite, and other bundlers that
find a worker by `new Worker(new URL("…", import.meta.url))`, bundle it from
psyche for you. Otherwise, bundle `psyche/worker` yourself and pass its url as
`worker`:

```ts
// search.worker.ts, e.g. for esbuild
import "psyche/worker";
```

For a small index, the store can match on the page instead: pass
`worker: false`. The matching is then loaded as a separate chunk, the first
time the search is used, and `index` can be a function that loads it.

## The store

`createSearch` makes the search's store. Fields, and their tiers, are always
yours: a record's score is its best value's match (0 to 1) plus its field's
tier, see [matching](#matching).

```ts
// search.ts, shared by your components
import { createSearch } from "psyche";

const search = createSearch<Page>({
  index: "/search.json", // relative to the page
  fields: [
    { key: "title", tier: 3 },
    { key: "headings", tier: 2.5 },
    { key: "tags", tier: 2 },
    { key: "body", tier: 1 },
  ],
});
```

Its options:

- `index` (required): the index's url, relative to the page. With
  `worker: false`, it can also be a function that loads the index's entries.
- `fields` (required): the fields searched, `{ key, tier }[]`. A record's score
  is its best value's match plus its field's tier.
- `limit`: the most results a search returns. Default: `6`.
- `excerpt`: the most characters an excerpt keeps of a text, with a quarter of
  its context before its match. Default: `192`.
- `threshold`: how tightly a query's characters must sit together to match,
  from 0 to 1: the share of the match's span they fill. Default: `0.4`.
- `sitemap(result)`: whether a result is listed for an empty query. Default:
  every entry's.
- `group`: a record's key that results are grouped by, e.g. `"section"`.
  Groups are ordered by their best result.
- `href(link, result, query)`: a result's `href`, from the link of its best
  match (its best value's, e.g. a heading's `#id`, or its page's). Default:
  that link with `?search=` the query.
- `navigate(href, { sourceElement })`: follows a result's link, given the
  result's element. Default: `location.assign(href)`. E.g. Astro's `navigate`,
  for view transitions.
- `onOpen()`: called as the search opens, e.g. to close other menus.
- `onLoad(page)`: called as each page loads, with `page` as in the state:
  `{ query }` for its `?search=` query (`""` for none), and for a query, once
  the index has loaded, `located`, the entry it matched, before it's
  highlighted. Return `true` to highlight it yourself, see
  [the landing page](#the-landing-page).
- `loadEvent`: the event a page has loaded by, on the window or the document,
  which its `?search=` query is handled on. Default: `"load"`. With a client
  router, use its event after each navigation, e.g. Astro's
  `"astro:page-load"`.
- `root`: the page content to highlight a `?search=` query's match in, a
  selector. Default: `"article"`.
- `worker`: psyche's worker's url, if your bundler doesn't find it, or `false`
  to match on the page, see [the worker](#the-worker).
- `origin`: loads the worker from the page's origin, not the script's, e.g.
  when scripts come from a dev server on another port that the page's server
  proxies.

Its state:

```ts
search.getState();
search.subscribe((state) => render(state)); // returns unsubscribe
// {
//   open, query, loading, selected,
//   results: [{ value, match?, matches, href, score }], // see below
//   groups: [{ group?, results: [{ result, index }] }],
//   page: { query, located? }, // the landing page's ?search= match
// }
```

`loading` is whether a search is waiting on the worker, and `selected` is the
selected result's index. `results` are the best matches, or the sitemap for an
empty query, and `groups` are the same results grouped by `group` (a single
group without it), each with its results' indexes.

A result is its entry's match, as `match` returns it for a record: `matches`
has each field's match, `{ value, match?, href?, score }` or an array of them,
with `value` excerpted around the match, and `match` is the best one's field
(and item), `{ key, index? }`. Its `href` is the link to visit it by, its best
match's, see the `href` option, and its `value` has the record's other values:
the searched ones are left out, as their matches stand in for them.

Its actions:

- `open()`: opens the search, fetches the index if it hasn't been, lists the
  sitemap if there's no query, calls `onOpen` and focuses the input.
- `close()`: closes the search and blurs the input.
- `toggle()`: opens the search if it's closed, and closes it if it's open.
- `input(query)`: sets the query and searches. An empty query lists the
  sitemap.
- `select(i)`: selects the `i`th result, within the results.
- `selectPrevious()`, `selectNext()`: selects the previous or next result,
  scrolls it into view and focuses the input.
- `visit(i?)`: follows the `i`th result's link (default: the selected
  result's) with `navigate`, then clears and closes the search.

`search.connect()` adds the open search's keyboard shortcuts (**/**, **↑ ↓**,
**Enter**, **Esc**) and page handling (on `loadEvent`) to the document, and
returns a function that removes them. Call it once, from
your panel. Opening it is up to you, e.g. with [`isShortcut`](#keys):

```ts
import { isShortcut, platformModifier } from "psyche";

document.addEventListener("keydown", (event) => {
  if (!isShortcut(event, "k", { mod: true })) return;
  event.preventDefault();
  search.toggle();
});
// for a legend: `${platformModifier()} + K` to toggle search
```

### Rendering a panel

Render from the state, and hand psyche your elements through `refs`. psyche
highlights matches in them, and moves focus and scroll:

```ts
search.refs.input($input);
search.refs.result(i)($a); // a result's link
search.refs.field(i, "title")($title); // a field shown in one element
search.refs.field(i, "tags", j)($tag); // each item of an array field
```

Refs are cleared whenever results change, so register them as you render.
[examples/lume](examples/lume/main.ts) renders a panel in plain DOM, bundled
with psyche's worker by Lume 4's `@lumeland/plugin-esbuild`:

```ts
// _config.ts
site.add("/main.ts");
site.add("/search.worker.ts");
site.use(esbuild());
```

### Frameworks

psyche has no framework adapters: subscribe to the store from your
framework's own state. In Solid, for example:

```tsx
import type { SearchState, SearchStore } from "psyche";
import { type Accessor, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";

const useSearch = <T extends Record<string, unknown>>(
  search: SearchStore<T>,
): Accessor<SearchState<T>> => {
  if (isServer) return search.getState;
  const [state, setState] = createStore({ ...search.getState() });
  onCleanup(search.subscribe((next) => setState(next)));
  return () => state;
};

function Search() {
  const state = useSearch(search);
  onMount(() => onCleanup(search.connect()));
  return (
    <For each={state().results}>
      {(result, i) => (
        <a ref={search.refs.result(i())} href={result.href}>
          <h3 ref={search.refs.field(i(), "title")}>{result.matches.title?.value}</h3>
        </a>
      )}
    </For>
  );
}
```

See [examples/astro](examples/astro), whose panel is an island:
`<Search client:only="solid-js" />`.

### The landing page

When a page loads with `?search=` in its url, psyche finds the entry it links
to: of the entries at its path, the one whose `href` has the most of the url's
query params, so an entry linked to by a param (e.g. a list's `?entry=`) is
found before its page. It highlights its match in `root`, and scrolls to it.
A match in a value
linking within the page (e.g. `#frost`) is highlighted in the element it links
to. Other array items, like tags, are left to
your components, which read the store's `page`:

```ts
search.subscribe(({ page }) => {
  // page.query: as the page loads ("" for none)
  // page.located: the entry's match, with its record as value, once the index has loaded
});
```

## Highlighting

Matches are highlighted as `::highlight(psyche)`:

```css
::highlight(psyche) {
  background-color: #fde047;
  color: #111;
}
```

`psyche` exports what it highlights with, for your own
components. Highlighting is two steps: `rangesOf` selects a match's ranges in
the elements it's shown in, and `highlight` highlights them.

`rangesOf(target, match)` takes any of `match`'s matches, with the elements
it's shown in:

```ts
rangesOf($title, match(query, title)); // a value's match, in its element
rangesOf($tags, match(query, tags)); // each value's match, in each item's element
rangesOf({ title: $title, tags: $tags }, match(query, record, { fields })); // each field's
rangesOf($article, match(query, record, { fields })); // within a page, as a landing page is
```

Texts are found ignoring whitespace and curly quotes, so excerpts are found
across element boundaries. Within a page, values linking within it are found
in the element they link to, and other array items (e.g. tags) are left to
your components.

`highlight(ranges, name?)` highlights ranges in `::highlight(name)` (default:
`psyche`), and returns their removal, which removes only those ranges, so your
components, the results and the landing page never clear each other's:

```tsx
createEffect(() => onCleanup(highlight(rangesOf($tags, match(query(), tags)))));
```

## Matching

`match` and `rank` are psyche's fuzzy matching, for your own components to match
by the same rules. `match(query, input, options?)` finds every match in a
value, values, a record or records, with their scores:

```ts
match(query, "Growing kale"); // { value, match?, score }, value excerpted around the match
match(query, ["Kale", { value: "Frost", href: "#frost" }]); // each value's, kept whole, with its href
match(query, record, { fields }); // { value: record, match?, matches, score }
match(query, records, { fields }); // each record's
match(query, { value: record, href: "/kale" }, { fields }); // a linked record's, with its href
```

A text's score is 0 for no match, up to 1, and its `match` is the text it
matched. A record's `matches` has each field's match, its score is its best
value's plus its field's tier, and its `match` is that value's field (and
item), `{ key, index? }`. A linked value's match has its `href`. Its options
are the worker's `excerpt` and `threshold`, and `fields` for records.

`Match<V>` is the match of any `Value`, as `match` returns it: a text's, a
record's, each with `{ href: string }` if linked, and an array of them for an
array:

```ts
type Match<V extends Value> = V extends readonly (infer I)[]
  ? Match<I>[]
  : V extends Linked<infer P>
    ? Match<P> & { href: string }
    : V extends string
      ? { value: string; match?: string; score: number }
      : { value: V; match?: { key; index? }; matches: { [field]?: Match }; score: number };
```

`rank(matches, limit?)` orders matches by score, best first, without those
that didn't match, and keeps at most `limit`:

```ts
rank(match(query, records, { fields }), 6).map(({ value }) => value);
```

## Keys

`isShortcut` and `platformModifier` are what psyche's shortcuts are checked
with, for your own:

- `isShortcut(event, key, modifiers?)`: whether a `KeyboardEvent` is `key`
  (case-insensitive), pressed with exactly the given modifiers,
  `{ mod?, shift?, alt? }`, each `false` by default. `mod` is **CTRL**, or
  **⌘** on macs.
- `platformModifier()`: the `mod` key's label, `"⌘"` on macs and iOS and
  `"CTRL"` elsewhere, e.g. for a legend.

## Types

`psyche` exports its types, each generic over your record's type, `T`:

- `SearchOptions<T>`, `SearchState<T>` and `SearchStore<T>`: `createSearch`'s
  options, its state, and the store it returns.
- `Result<T>`: a result, see [the store](#the-store), and `ResultGroup<T>`, a
  group of them, `{ group?, results: { result, index }[] }`.
- `Fields<T>`: the fields searched, `{ key, tier }[]`.
- `Value` and `Linked`: a field's value, and a linked one, see
  [the index](#the-index).
- `Match<V>`: the match of a `Value`, see [matching](#matching).
