# 🧠 psyche

**psyche** is a fast, typo-tolerant search for static and server-rendered sites,
built with [SolidJS](https://www.solidjs.com/).

- Matching runs in a **web worker**, so typing never waits on it, and the index is
  only fetched once search is needed.
- Results are **fuzzy matched** and ranked by field (title, headings, tags, body),
  with an excerpt around each match.
- Matches are highlighted with the **CSS Custom Highlight API**, in the results
  and on the page a result links to, including **deep links to headings**.
- An empty query lists a **sitemap**, and results are **grouped by section**.
- **⌘/CTRL + K** toggles search, **/** focuses it, **↑ ↓** move and **Esc** closes.
- Use the default panel, styled with **Tailwind**, or render your own with the same
  state.

psyche searches an index your site generates: generating it is up to your site,
see [the index](#the-index).

Psyche needs Chrome 105, Safari 17.2 or Firefox 140 and later.

## Install

```sh
pnpm add github:dragonwocky/psyche#semver:^1.0.0 solid-js
```

`solid-js` is a peer dependency: psyche shares your site's copy.

## The index

The index is a JSON array of records, served by your site:

```ts
import type { PsycheRecord } from "psyche";

const record: PsycheRecord = {
  href: "/posts/kale/",
  title: "Growing kale",
  body: "Sow kale in late summer…", // the page's text
  date: "27 October 2026", // shown, not searched
  authors: ["Alice Nguyen"], // shown as tags
  categories: ["Vegetables"],
  section: "Posts", // the group a result is listed under
  headings: [{ id: "frost", text: "After a frost" }], // deep links
  meta: {}, // your own data, passed to your hooks untouched
};
```

Only `href`, `title` and `body` are required. Records with `meta` are left out
of the sitemap by default.

### Ranking

Which fields are searched, and how they're weighted, is set by a ranking table.
The default, `RANKING`, ranks the title over headings over tags over the body:

```ts
import { RANKING } from "psyche/match";
// [
//   { key: "title", tier: 3, type: "text" },
//   { key: "headings", tier: 2.5, type: "headings" },
//   { key: "authors", tier: 2, type: "list", element: "tags" },
//   { key: "categories", tier: 2, type: "list", element: "tags" },
//   { key: "body", tier: 1, type: "text" },
// ]
```

A field's score is its match (0 to 1) plus its tier, and only the best field's
match is kept. Pass your own table to `createSearchClient(worker, { ranking })`
to search other fields: `text` fields are strings, `list` fields are string
arrays shown as tags, and `headings` fields are `{ id, text }` arrays.

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
  psyche looks for the record at the url's path. Use it for records without a
  page of their own, such as an entry in a list.
- `sitemap(record)`: whether a record is listed for an empty query. Default:
  records without `meta`.

## Astro

With [`@astrojs/solid-js`](https://docs.astro.build/en/guides/integrations-guide/solid-js/),
import the worker's url and render the default panel as a `client:only` island:

```tsx
// src/components/Search.tsx
import { Search as Psyche } from "psyche";

import workerUrl from "../search.worker?worker&url";

export default function Search() {
  return <Psyche worker={workerUrl} />;
}
```

```astro
<Search client:only="solid-js" />
```

Or render your own panel with `createSearch`, as in
[examples/astro](examples/astro):

```tsx
import { createSearch, createSearchClient } from "psyche";

const search = createSearch(createSearchClient(workerUrl, { href, ranking }), {
  navigate, // e.g. astro:transitions' navigate
  onOpen, // e.g. to close a menu
  onLocate, // to highlight a located record yourself
});
// search.query(), search.input(text), search.groups(), search.selected(),
// search.isOpen(), search.open(), search.close(), search.visit(),
// search.href(result), search.legend(), search.refs.input, search.refs.result(i)
```

psyche's builds are for the browser, so its components can't render on the
server: use `client:only`.

## Lume

[Lume 4](https://lume.land) bundles client scripts with
`@lumeland/plugin-esbuild`, which bundles psyche's prebuilt components as they
are. Mount the default panel from a client script, as in
[examples/lume](examples/lume):

```ts
// _config.ts
import lume from "@lumeland/lume";
import esbuild from "@lumeland/plugin-esbuild";

const site = lume();
site.add("/main.ts");
site.add("/search.worker.ts");
site.copy(import.meta.resolve("psyche/styles.css"), "/psyche.css");
site.use(esbuild());

export default site;
```

```ts
// main.ts
import { mount } from "psyche";

mount({ worker: "/search.worker.js" });
```

Generate the index with a page, such as `search.json.page.ts`:

```ts
export const url = "/search.json";

export default ({ search }) =>
  JSON.stringify(
    search.pages().map((page) => ({ href: page.url, title: page.title, body: page.content })),
  );
```

## Styles

The default panel is styled with Tailwind utility classes, coloured by psyche's
palette.

- Without Tailwind, link `psyche/styles.css`. It holds the panel's utilities and
  the palette, without Tailwind's preflight, and it's dark when the page has a
  `.dark` class. You can also `@import` it into your own Tailwind CSS, where it
  merges into Tailwind's layers.
- With Tailwind 4, scan psyche's build for its classes and import the palette:

  ```css
  @import "tailwindcss";
  @import "psyche/theme.css";
  @source "../node_modules/psyche/dist";
  ```

  The panel's `dark:` classes then use your site's own dark variant.

Every colour is a CSS variable you can override. `--psyche-accent` sets the
accent shades, and the greys are `--color-psyche-ghost-100` to `-800`:

```css
:root {
  --psyche-accent: #1769b4;
}
```

`<Search>` and `mount` also take `placeholder` and `noResults` text.

## Highlighting

Matches are highlighted as `::highlight(psyche)`. In a results panel of your
own, mark the fields to highlight with `data-psyche`:

```tsx
<a ref={search.refs.result(index)} href={search.href(result)}>
  <h3 data-psyche="title">{result.match.title.text}</h3>
  <p data-psyche="headings">{result.heading?.text}</p>
  <p data-psyche="body">{result.match.body.text}</p>
  <div data-psyche="tags">{/* one element per tag: authors, then categories */}</div>
</a>
```

`psyche/highlight` exports the functions psyche uses, for highlighting matches
in your own components:

- `createHighlights(name?)` returns a function that replaces only its own ranges
  in the shared highlight.
- `rangeOf(element, text)` finds a match's text in an element. It ignores
  whitespace and curly quotes, so excerpts are found across element boundaries.
- `highlightItems(element, items)` highlights each child element by its item's
  match.
- `highlightFields(element, match, { ranking, page })` highlights each
  ranked field in its `[data-psyche]` element. With `page`, as for a landing
  page, text fields are found in the element's own text, headings by id, and
  tags are left to your components.

### Highlighting on the page

When a page loads with `?search=` in its url, psyche finds and highlights the
match in its `<article>`, and announces it on `document`:

```ts
document.addEventListener("psyche:match", ({ detail }) => {
  // detail.query: the page's query, sent as the page loads ("" for none)
  // detail.result: { res, match }, sent again once the index has loaded
});
// components that mount later ask for the latest match again
document.dispatchEvent(new Event("psyche:request"));
```

Use these events to highlight matches in components that hydrate after
psyche, such as tags, or a list entry that `locate` found (return `true` from
`onLocate` to leave its highlighting to you).

## Other exports

- `psyche/match`: `match`, `matchFields`, `matchItems` and `rank`, psyche's
  fuzzy matching, for filtering lists by the same rules, e.g.
  `rank(query, options, (option) => option.name)`.
- `psyche/keys`: `isShortcut(event, key, { mod, shift, alt })` and
  `platformModifier()` (`⌘` or `CTRL`).
- `psyche/client`: `openSearch`, `closeSearch`, `toggleSearch` and
  `isSearchOpen`, for your own search buttons.

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
