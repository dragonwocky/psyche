/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

// a plugin for https://lumeland.github.io/ to generate
// an index file for consumption by the psyche client

import { Result } from "../types.d.ts";

// use the slugify module over lume's builtin slugifier:
// has a builtin unicode charmap to handle special characters
import { slugify as slugifierEngine } from "https://deno.land/x/slugify@0.3.0/mod.ts";

import { Site } from "https://deno.land/x/lume@v1.4.2/core.ts";
import { merge } from "https://deno.land/x/lume@v1.4.2/core/utils.ts";
import { Page } from "https://deno.land/x/lume@v1.4.2/core/filesystem.ts";
import { extname } from "https://deno.land/x/lume@v1.4.2/deps/path.ts";
import { Element } from "https://deno.land/x/lume@v1.4.2/deps/dom.ts";

export interface Options {
  output: string;
  // exclude pages from the generated index
  // default: excludes pages where data.draft = true
  // & pages without data.section
  filter: (page: Page) => boolean;
  // decides page order in the index
  // default: groups by data.section_order
  // and sorts by data.order
  sort: (a: Page, b: Page) => number;
  // access title from page data
  // default: returns data.title
  title: (page: Page) => string;
  // access section from page data
  // default: returns data.section
  section: (page: Page) => string;
  // css selector for container to index
  // paragraphs within to ignore template
  // components e.g. a nav or sidebar
  // default: article
  selector: string;
}

const defaults: Options = {
  output: "/search.json",
  filter: (page: Page) => <boolean> (page.data.section && !page.data.draft),
  sort: (a: Page, b: Page) => {
    if (a.data.section_order === b.data.section_order) {
      return (<number> a.data.order ?? 0) - (<number> b.data.order ?? 0);
    }
    return (<number> a.data.section_order ?? 0) -
      (<number> b.data.section_order ?? 0);
  },
  title: (page: Page) => <string> page.data.title ?? "",
  section: (page: Page) => <string> page.data.section ?? "",
  selector: "article",
};

const slugify = (
  str: string,
  cache: string[] = [],
): string => {
  // limit length, don't cut words in half
  str = str.slice(0, 32);
  str = str.slice(0, str.lastIndexOf(" "));
  // prevent duplicate ids
  let duplicates = 0;
  const base = slugifierEngine(str, { lower: true }),
    computed = () => (duplicates ? `${base}-${duplicates}` : base);
  while (cache.some((slug) => slug === computed())) duplicates++;
  cache.push(computed());
  return computed();
};

const containerTags = [
    "HEADER",
    "ASIDE",
    "MAIN",
    "ARTICLE",
    "SECTION",
    "FOOTER",
    "DIV",
    "BLOCKQUOTE",
    "TABLE",
    "THEAD",
    "TBODY",
    "TR",
    "UL",
    "OL",
  ],
  headingTags = ["H1", "H2", "H3", "H4", "H5", "H6"];

export default (opts: Partial<Options> = {}) => {
  const options = <Options> merge(defaults, opts);
  return (site: Site) => {
    // listener is as late as possible to allow
    // other processors (e.g. toc generators)
    // to do their work first (e.g. assign element ids)
    site.addEventListener("beforeSave", () => {
      const index: Result[] = [],
        pages = site.pages.filter((page) =>
          page.dest.ext === ".html" && options.filter(page)
        ).sort(options.sort);

      for (const page of pages) {
        const url = page.dest.path.endsWith("/index")
          ? page.dest.path.slice(0, -"index".length)
          : page.dest.path;
        index.push({
          url,
          type: "page",
          content: options.title(page),
          section: options.section(page),
        });

        const slugs: string[] = [],
          cacheIDs = ($element: Element) => {
            if ($element.hasAttribute("id")) slugs.push($element.id);
            for (const $child of $element.children) cacheIDs($child);
          };
        cacheIDs(page.document!.body);

        const indexResult = (
            type: "heading" | "paragraph" | "list",
            content: string,
            id: string,
          ) => {
            // prevent apparently duplicate entries
            const duplicate = index.some((result) =>
              result.type === type && result.content === content
            );
            if (!duplicate && content) {
              index.push({
                url: `${url}#${id}`,
                type,
                content,
                description: options.title(page),
                section: options.section(page),
              });
            }
          },
          indexElements = ($elements: Element[]) => {
            for (let $ of $elements) {
              const id = () => {
                  const id = $.getAttribute("id") ||
                    slugify($.innerText, slugs);
                  $.setAttribute("id", id);
                  return id;
                },
                trim = (str: string) => str.replace(/[\n\s]+/, " ").trim();

              const isContainer = containerTags.includes($.nodeName);
              if (isContainer) {
                if ($.children.length === 0 && $.innerText) {
                  indexResult("paragraph", trim($.innerText), id());
                } else indexElements([...$.children]);
                continue;
              }
              const isListItem = $.nodeName === "LI",
                isNestedListParent = isListItem &&
                  $.childNodes[0]?.nodeName === "P";
              if (isListItem) {
                if (isNestedListParent) {
                  const $children = [...$.children];
                  $ = $children.shift()!;
                  indexResult("list", trim($.innerText), id());
                  indexElements($children);
                } else indexResult("list", trim($.innerText), id());
                continue;
              }

              const isHeading = headingTags.includes($.nodeName);
              if (isHeading) {
                indexResult("heading", trim($.innerText), id());
                continue;
              }
              const preserveWhitespace = $.nodeName === "PRE";
              if (preserveWhitespace) {
                indexResult("paragraph", $.innerText, id());
                continue;
              }
              indexResult("paragraph", trim($.innerText), id());
            }
          };
        const $container = page.document!.querySelector(options.selector);
        if ($container) indexElements([...$container.children]);
      }

      // all lume outputs are "pages"
      // inc. generated assets
      const ext = extname(options.output),
        path = options.output.slice(0, -ext.length),
        page = new Page({ path, ext });
      page.content = JSON.stringify(index);
      site.pages.push(page);
    });
  };
};
