# 🧠 psyche

**psyche** is a drop-in solution for searching documentation,
inspired by Algolia's [DocSearch](https://docsearch.algolia.com/).

- It **looks and feels awesome** to use.
- Searching is **fast, accurate and typo-tolerate**.
- It can be included in any **static or server-generated** documentation website.
- It doubles as a **keyboard-navigable sitemap** and a convenient list of site-wide hotkeys.
- It's **mobile-friendly**.
- It supports both **light and dark modes**.

Check out the [notion-enhancer documentation](http://notion-enhancer.github.io/) for a live demo.

->> SCREENSHOT

> **Warning:** It is _not_ a search engine, though it contains one. It is built
> specifically for searching documentation, and it does that well.
> It is not built for implementation into other interfaces (e.g.
> eCommerce) or programmatic use with custom data schemas.
>
> If that's what you're looking for, consider something like
> [Algolia](https://www.algolia.com/) or [Fuse.js](https://fusejs.io/).

## Getting started

### Generating an index

The psyche client requires a pre-generated index of results to search.
This should be an array of `Result` records (see [types.d.ts#L10](./types.d.ts)).
Indexes are provided to the client programmatically, but should take the
form of an unformatted/minified `.json` file.

Indexers are plugins/middleware that crawl a site and generate an index,
either during a build process or on-the-fly if the site is dynamically served.

Indexers for some documentation generators are provided below.
If your generator of choice is not yet supported, either open a
[feature request](https://github.com/dragonwocky/psyche/issues)
or write your own and open a [pull request](https://github.com/dragonwocky/psyche/pulls).

#### [🔥 Lume](https://lumeland.github.io/)

Add the following to your `_config.ts` file:

```ts
import psyche from 'https://deno.land/x/psyche/indexers/lume.ts';

site.use(psyche());
```

Optionally, the indexer can be configured by providing a `LumeConfig`
object as the first argument of the `psyche()` call (see [types.d.ts#L117](./types.d.ts)).

By default:

- The index will be output to `/search.json`.
- Pages without `data.section` or where `data.draft = true` will be ignored.
- Pages will be grouped by `data.section_order` & sorted by `data.order`.
- Page titles are accessed from `data.title`.
- Page sections are accessed from `data.section`.
- Headings, code blocks, paragraphs and lists within an `<article></article>` element
  in a page are indexed according to semantic HTML. Other elements (e.g.
  `<blockquote></blockquote>`) are treated as paragraphs. This works best
  with markdown output.

Read the [page data](https://lumeland.github.io/creating-pages/page-data/)
and/or [shared data](https://lumeland.github.io/creating-pages/shared-data/)
pages of Lume's documentation to see how to set these properties.

### Including the client

The psyche client is written in TypeScript. You can either directly import
it if your site's assets are bundled by e.g. [ESBuild](https://esbuild.github.io/),
or import the pre-transpiled and minified JavaScript build.

```js
import psyche from 'https://deno.land/x/psyche/client/mod.ts';
// or
import psyche from 'https://deno.land/x/psyche/client/psyche.min.mjs';
```

The `psyche` default export is a function that when provided with
a `ClientConfig` object (see [types.d.ts#31](./types.d.ts)) will
return a `ClientInstance` (see [types.d.ts#100](./types.d.ts)).

Calling `.register()` on a client instance will insert the component
into the document and listen for hotkey presses. The component can
then be opened either by calling `.open()` or by pressing `CTRL/⌘ + K`.

E.g.

```js
const searchInstance = psyche({
  theme: { scrollbarStyle: 'square' },
  hotkeys: [{ kbd: '{{modifier}} + SHIFT + L', label: 'to toggle theme' }],
  index: await fetch('/search.json').then((res) => res.json()),
});
searchInstance.register();
searchInstance.open();
```

---

For a history of the project and information about recent changes,
see the [CHANGELOG](CHANGELOG.md).

This project is licensed under the [MIT License](LICENSE).
