# Changelog

## v1.0.0 (2026-11-06)

A headless rewrite: psyche keeps the search's state, matching and
highlighting, and sites render their own interface.

### Added

- `createSearch(options)`, a store without a framework: its state
  (`getState`, `subscribe`), its actions (`open`, `close`, `toggle`, `input`,
  `select`, `selectPrevious`, `selectNext`, `visit`, `href`), `refs` for the
  elements a site renders results in, and `connect()` for its keyboard
  shortcuts and page handling.
- Matching in psyche's own web worker, which bundlers like Vite find and bundle
  from psyche (or `psyche/worker`, for others), and which fetches the index from
  its url only once search is needed. `worker: false` matches on the page
  instead, and `origin` loads the worker from the page's origin.
- Fields of any name, ranked by tier: a field's value is text, or a record
  matched by the same fields, either linked to a part of its page
  (`{ value, href }`, e.g. a heading's `#id`, which its result then links to),
  or an array of them.
- `psyche/match`: `match` finds every match in a value, values, a record or
  records, with their scores and an excerpt around each, and `rank` orders
  them. `Match<S>` is the type of any match.
- `excerpt`, `lead` and `threshold` options for excerpts and how tightly
  queries match, and `limit` for the number of results (default: 6).
- Highlighting with the CSS Custom Highlight API, as `::highlight(psyche)`, in
  the results and on the page a result links to. `psyche/highlight` exports
  `rangesOf` and `highlight`, for highlighting in a site's own components.
- Landing on a page with `?search=` highlights its match within `root`, and
  scrolls to it. The store's `page` state has the match, `onLoad(page)` is
  called as each page loads, and `loadEvent` is the event a page is handled
  on: `load` by default, or a client router's, e.g. Astro's
  `astro:page-load`.
- `sitemap(result)`, `group`, `href(link, result, query)`, `navigate(href)`
  and `onOpen()` options.
- `psyche/keys`: `isShortcut(event, key, modifiers)`, for a site's own
  shortcuts.
- Examples for Astro (a Solid panel) and Lume 4 (a panel in plain DOM).

### Changed

- The index is fetched from a url, `index` (required), rather than passed to
  the client. Its entries are a site's own records linked to their pages,
  `{ href, value: record }`, in place of `Result`s
  (`{ type, icon, content, description, section, url }`). A record's values
  that aren't searched are passed through to its result.
- Results are their entries' matches, with each field's match and an excerpt
  around it, rather than the entries themselves.
- Matching is psyche's own fuzzy matching, ranked by each field's tier, in
  place of FuzzySet behind exact matches. A search returns its best 6 results
  by default, rather than every match.
- Results are only grouped by a `group` key if given, rather than always by
  `section`.
- An empty query lists every entry, or those `sitemap(result)` keeps, rather
  than every `page`.
- Matches are highlighted with `::highlight(psyche)`, rather than `<mark>`.
- `platformModifier` is a function, from `psyche/keys`, rather than a string.
- Installs with pnpm from git tags, as an ES module package with an
  entry point for each export, rather than imported from deno.land.

### Removed

- The search modal: its component (`$component`), styles, icons, light and dark
  themes, and the `theme`, `messages` and `hotkeys` options. Sites render their
  own interface.
- `psyche(config).register()` and `unregister()`, and `psyche.min.mjs`.
- The Lume indexer (`indexers/lume.ts`) and `LumeConfig`: sites generate their
  own index.
- The built-in ⌘/CTRL + K shortcut, `registerHotkey` and `unregisterHotkey`:
  sites open the search themselves, e.g. with `isShortcut`.
- FuzzySet and feather-icons as dependencies.

## v0.3.4 (2022-02-23)

## Fixed

- Replaced `requestIdleCallback` with `setTimeout` for Safari support.

## v0.3.3 (2022-01-30)

## Added

- `scroll-behaviour: smooth`

## v0.3.2 (2022-01-29)

### Changed

- Focused results are outlined to differentiate them from
  hovered results.

### Fixed

- `<mark></mark>` elements are styled according to the accent
  colour (the browser's built-in yellow highlight doesn't contrast
  well with other light colours).

## v0.3.1 (2022-01-28)

### Added

- Exported the `platformModifier` string for direct use
  (e.g. in search trigger labels).

### Removed

- Removed `{{platformModifier}}` tag replacement.

### Fixed

- Depend on the more reliable `site.url(<string> page.data.url)`
  for detecting Lume page URLs.

## v0.3.0 (2022-01-27)

### Added

- Adjusted and exposed the internal hotkey registration
  for use with a `platformModifier` property equivalent
  to the `{{platformModifier}}` tag.

### Changed

- Moved the Lume indexer's slugifer to the `indexers/shared.ts` file.
- Renamed the `{{modifier}}` tag to `{{platformModifier}}`.

### Fixed

- Slugifier no longer slices the last letter off
  slugs generated from headings without spaces.
- Modals close when results are clicked.
- Removed `console.log` debug statement.
- Gave `position:sticky` priority over `position:-webkit-sticky`.

## v0.2.0 (2022-01-26)

### Added

- Configuration options.
- Zoom-in-zoom-out modal open animation.
- Rounded scrollbar style.
- Footer copyright.
- `{{modifier}}` tag for platform-specific hotkeys
  (replaced with `⌘` on MacOS and `CTRL` on other platforms).
- Added `list` and `code` result types.

### Changed

- Component constructed on the client-side instead of during site generation.
- Scoped CSS styling instead of utility classes.
- More efficient search caching logic.
- Tweaked text sizing and positioning.

### Fixed

- Slugs generated by the Lume indexer no longer cut words in half.
- The Lume indexer uses Deno's import map to infer the current version of
  Lume and prevent dependeny conflicts on Lume updates.
- Empty `<mark></mark>` elements are no longer added to results.
  This occured when the search input was empty and only `{ type: "page" }`
  results were displayed, and would cause e.g. `&` to be displayed as `&amp;`.

## v0.1.0 (2021-12-31)

First version, hardcoded into the notion-enhancer website.

- Site indexing performed during the build process.
- Basic exact & fuzzy search logic.
- Interface contained within a toggleable modal and styled with utility classes.
- A desktop-only footer with a list of available navigation hotkeys.
