/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

interface SearchEntry {
  // empty query = returns all { type: "page" }
  // otherwise used to decide fallback icons
  // * page = file-text
  // * heading = hash
  // * paragraph = align-left
  type: "page" | "heading" | "paragraph";
  // icon name from https://feathericons.com/
  icon?: string;
  // searchable text
  title: string;
  // provides additional information to users
  // e.g. the title of the source page
  subtitle?: string;
  // the section/category the item falls into
  group: string;
  // a link to the item
  url: string;
}
