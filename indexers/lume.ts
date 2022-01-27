/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

// a plugin for https://lumeland.github.io/ to generate
// an index file for consumption by the psyche client

import type { LumeConfig, Result } from "../types.d.ts";
import { slugify } from "./shared.ts";

import type { Element } from "lume/deps/dom.ts";
import type { Site } from "lume/core.ts";
import { merge } from "lume/core/utils.ts";
import { Page } from "lume/core/filesystem.ts";
import { extname } from "lume/deps/path.ts";

const defaults: LumeConfig = {
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

export default (opts: Partial<LumeConfig> = {}) => {
  const options = <LumeConfig> merge(defaults, opts);
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
        const url = site.url(<string> page.data.url);
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
            type: Result["type"],
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
              const codeBlock = $.nodeName === "PRE";
              if (codeBlock) {
                indexResult("code", $.innerText, id());
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
