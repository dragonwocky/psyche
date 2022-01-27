/**
 * psyche
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/psyche) under the MIT license
 */

import type { SearchComponent } from "./client/dom/elements.ts";
import type { Page } from "https://deno.land/x/lume@v1.4.3/core/filesystem.ts";

interface Result {
  // empty query = returns all { type: "page" }
  // otherwise used to decide fallback icons
  // * page = file-text
  // * heading = hash
  // * list = list
  // * paragraph = align-left
  type: "page" | "heading" | "list" | "code" | "paragraph";
  // icon name from https://feathericons.com/
  icon?: string;
  // searchable text
  content: string;
  // provides additional information to users
  // e.g. the title of the source page
  description?: string;
  // the group/category the item falls into
  section: string;
  // a link to the item
  url: string;
}

interface ClientConfig {
  theme: {
    font: {
      // default: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      sans: string;
      // default: "'Courier New', Courier, monospace"
      mono: string;
    };
    light: {
      // default: "#0f0f0f"
      text: string;
      // default: "#3f3f46"
      secondary: string;
      // default: "#dee2e6"
      background: string;
      // default: "rgba(255, 255, 255, 0.6)"
      shadow: string;
      // default: "#d4d4d8"
      border: string;
      // default: "#ea596e"
      accent: string;
      // default: "#f1f3f5"
      interactive: string;
      // default: "#d4d4d8"
      scrollbar: string;
      // default: "#a1a1aa"
      scrollbarHover: string;
    };
    dark: {
      // default: "#dde1e3"
      text: string;
      // default: "#a1a1aa"
      secondary: string;
      // default: "#181818"
      background: string;
      // default: "rgba(0, 0, 0, 0.6)"
      shadow: string;
      // default: "#222222"
      border: string;
      // default: "#f4abba"
      accent: string;
      // default: "#1f1f1f"
      interactive: string;
      // default: "#222222"
      scrollbar: string;
      // default: "#2d2d2d"
      scrollbarHover: string;
    };
    // whether to active dark mode
    // when the document has the .dark class
    // or when the user's device is in dark mode
    // default: "class"
    darkMode: "class" | "media";
    // default: "rounded"
    scrollbarStyle: "square" | "rounded";
  };
  messages: {
    // default: "Search docs..."
    inputPlaceholder: string;
    // default: "No results found. Try entering a different search term?"
    noResultsFound: string;
  };
  // unlike other options, which are overriden by
  // user-provided values, the list of hotkeys can only
  // be appended to. this list is purely informative,
  // hotkey behaviours must be implemented separately
  hotkeys: {
    // {{platformModifier}} will be replaced by
    // ⌘ on macOS, CTRL elsewhere
    kbd: string;
    label: string;
  }[];
  // a pre-generated list of results for the client to search
  // (see the readme for index generation instructions)
  // default: []
  index: Result[];
}

interface ClientInstance {
  // the <psyche-search></psyche-search> element
  // the component is contained within
  $component: SearchComponent;
  // inserts the component into the document
  // and listens for hotkey presses
  register: () => void;
  // removes the component from the document
  // and cancels the hotkey listener
  unregister: () => void;
  // brings the component into view and focuses
  // the search input
  open: () => void;
  // hides the component from view
  close: () => void;
}

interface ClientHotkey extends Partial<KeyboardEvent> {
  // equiv. to metaKey (⌘) on macOS, CTRL elsewhere
  platformModifier?: boolean;
  onkeydown?: (event: KeyboardEvent, $: SearchComponent) => void;
  onkeyup?: (event: KeyboardEvent, $: SearchComponent) => void;
}

interface LumeConfig {
  // index output filepath
  // default: "/search.json"
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

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export {
  ClientConfig,
  ClientHotkey,
  ClientInstance,
  LumeConfig,
  RecursivePartial,
  Result,
};
