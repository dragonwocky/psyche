# 🧠 psyche

**psyche** is a fast, typo-tolerant, headless search for static and
server-rendered sites.

- Matching runs in a **web worker**, so typing never waits on it, and the index is
  only fetched once search is needed.
- Results are **fuzzy matched** and ranked by the fields you choose, with an
  excerpt around each match.
- Matches are highlighted with the **CSS Custom Highlight API**, in your results
  and on the page a result links to, including **deep links** to headings.
- An empty query lists a **sitemap**, and results can be **grouped**.
- **⌘/CTRL + K** toggles search, **/** focuses it, **↑ ↓** move and **Esc** closes.
- **Headless:** psyche is a store without a framework. You render the panel,
  with plain DOM or any framework, and Solid has an adapter.

psyche searches an index your site generates: generating it is up to your site,
see [the index](#the-index).

Psyche needs Chrome 105, Safari 17.2 or Firefox 140 and later.

## Install

```sh
pnpm add github:dragonwocky/psyche#semver:^1.0.0
```

For `psyche/solid`, your site's `solid-js` is used: it's an optional peer
dependency.

## The index

The index is a JSON array of records, served by your site. A record only needs
an `href`. Its other values are yours: the fields you search, and anything else
you want in results, which is passed through to them untouched.

```ts
const record = {
  href: "/posts/kale/",
  title: "Growing kale",
  body: "Sow kale in late summer…", // the page's text
  headings: [{ value: "After a frost", id: "frost" }], // values with ids link to #id
  tags: ["Vegetables"],
  date: "27 October 2026", // not searched: passed through as data
};
```

A searched value is text, or text with the id of the element it's shown in on
its page (`{ value, id }`), or an array of either:

```ts
type Value = string | { value: string; id: string };
type Shape = Value | Value[];
```

## The worker

Your site bundles a small worker module, which fetches the index and matches
it:

```ts
// search.worker.ts
import { createSearchWorker } from "psyche/worker";

createSearchWorker({ index: "/search.json" });
```

`createSearchWorker` takes:

- `index`: the index's url, or a function that loads it. Default: `/search.json`.
- `locate(records, query, url)`: finds the record a url links to, before
  psyche takes the first record at the url's path. Use it for records without a
  page of their own, such as an entry in a list.
- `sitemap(record)`: whether a record is listed for an empty query. Default:
  every record.

## The store

`createSearch` makes the search's store. Fields, and their tiers, are always
yours: a value's score is its match (0 to 1) plus its field's tier, and only
the best value's match is kept.

```ts
// search.ts, shared by your components
import { createSearch } from "psyche";

const search = createSearch<Page>({
  worker: "/search.worker.js",
  fields: [
    { key: "title", tier: 3 },
    { key: "headings", tier: 2.5 },
    { key: "tags", tier: 2 },
    { key: "body", tier: 1 },
  ],
});
```

It also takes:

- `group`: a data key that results are grouped by, e.g. `"section"`.
- `href(result, query)`: a result's link. Default: its href with `?search=` the
  query, then `#id` for a best match with an id.
- `navigate(href, { sourceElement })`: follows a link, e.g. Astro's `navigate`.
- `onOpen()`, and `onLocate(located)`, which runs before a landing page is
  highlighted: return `true` to highlight it yourself.
- `root` (default `article`), the page content to highlight in, and
  `highlight` (default `psyche`), the `::highlight()` name.
- `origin`: loads the worker from the page's origin, not the script's.

Its state:

```ts
search.getState();
search.subscribe((state) => render(state)); // returns unsubscribe
// {
//   open, query, loading, selected,
//   results: [{ href, score, match, anchor?, data }],
//   groups: [{ group?, results: [{ result, index }] }],
//   page: { query, located? }, // the landing page's ?search= match
// }
```

A result's `match` has each field's match, `{ text, match?, id? }` or an array
of them, with `text` excerpted around the match. `match.best` is the best
field (and item). Its actions are `open`, `close`, `toggle`, `input(query)`,
`select(i)`, `selectPrevious`, `selectNext`, `visit(i?)` and `href(result)`.
`legend()` is the shortcut to list, `{ kbd: "⌘ + K", label }`.

`search.connect()` adds the keyboard shortcuts and page handling to the
document, and returns a function that removes them. Call it once, from your
panel.

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
with its worker by Lume 4's `@lumeland/plugin-esbuild`:

```ts
// _config.ts
site.add("/main.ts");
site.add("/search.worker.ts");
site.use(esbuild());
```

### Solid

`useSearch` is the store's state as a signal:

```tsx
import { useSearch } from "psyche/solid";

function Search() {
  const state = useSearch(search);
  onMount(() => onCleanup(search.connect()));
  return (
    <For each={state().results}>
      {(result, i) => (
        <a ref={search.refs.result(i())} href={search.href(result)}>
          <h3 ref={search.refs.field(i(), "title")}>{result.match.title?.text}</h3>
        </a>
      )}
    </For>
  );
}
```

See [examples/astro](examples/astro), whose panel is an island:
`<Search client:only="solid-js" />`.

### The landing page

When a page loads with `?search=` in its url, psyche finds the record it links
to, highlights its match in `root`, and scrolls to it. A match with an id is
highlighted in that element. Array items without ids, like tags, are left to
your components, which read the store's `page`:

```ts
search.subscribe(({ page }) => {
  // page.query: as the page loads ("" for none)
  // page.located: { record, match }, once the index has loaded
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

`psyche/highlight` exports the functions psyche uses, for your own components:

- `createHighlights(name?)` returns a function that replaces only its own ranges
  in the shared highlight.
- `highlightMatch(target, match)` highlights a field's match in an element, or
  an array field's matches in a list of elements.
- `highlightLocated(root, match)` highlights a landing page's match.
- `rangeOf(element, text)` finds a match's text in an element. It ignores
  whitespace and curly quotes, so excerpts are found across element boundaries.

## Other exports

- `psyche/match`: `match`, `matchFields(query, record, fields)`,
  `matchValues(query, values)` and `rank(query, items, text)`, psyche's fuzzy
  matching, for filtering lists by the same rules.
- `psyche/keys`: `isShortcut(event, key, { mod, shift, alt })` and
  `platformModifier()` (`⌘` or `CTRL`).

## Development

```sh
pnpm install
pnpm check         # types
pnpm test          # unit tests, in node
pnpm test:browser  # dom tests, in headless chrome over the devtools protocol
pnpm bench         # matchFields over 2000 records
pnpm build         # dist/
```

`pnpm test:browser` finds Chrome at `$CHROME`, then `chrome` or `chromium` on
the `PATH`, then Windows Chrome from WSL. The examples use the local build:
run `pnpm build` first.

Releases are tagged by hand, with the build committed for installs from git:

```sh
pnpm check && pnpm test && pnpm test:browser && pnpm build
git add -f dist && git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
```

---

Changes to this project are recorded in the [CHANGELOG](CHANGELOG.md).

This project is licensed under the [MIT License](LICENSE).

To support future development of this project, please consider
[sponsoring the author](https://github.com/sponsors/dragonwocky).
