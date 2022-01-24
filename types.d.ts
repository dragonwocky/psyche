/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

export class SearchComponent extends HTMLElement {}

export interface Result {
  // empty query = returns all { type: "page" }
  // otherwise used to decide fallback icons
  // * page = file-text
  // * heading = hash
  // * list = list
  // * paragraph = align-left
  type: "page" | "heading" | "list" | "paragraph";
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

export interface ClientConfig {
  theme: {
    font: {
      sans: string;
      mono: string;
    };
    animationDuration: string;
    light: {
      text: string;
      secondary: string;
      background: string;
      shadow: string;
      border: string;
      accent: string;
      interactive: string;
      scrollbar: string;
      scrollbarHover: string;
    };
    dark: {
      text: string;
      secondary: string;
      background: string;
      shadow: string;
      border: string;
      accent: string;
      interactive: string;
      scrollbar: string;
      scrollbarHover: string;
    };
    darkMode: "class" | "media";
    scrollbarStyle: "square" | "rounded";
  };
  messages: {
    placeholder: string;
    empty: string;
  };
  hotkeys: {
    kbd: string;
    label: string;
  }[];
  index: Result[];
}
