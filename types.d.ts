/**
 * rubbersearch
 * (c) 2022 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://github.com/dragonwocky/rubbersearch) under the MIT license
 */

export interface Result {
  // empty query = returns all { type: "page" }
  // otherwise used to decide fallback icons
  // * page = file-text
  // * heading = hash
  // * paragraph = align-left
  // * list = list
  type: "page" | "heading" | "paragraph" | "list";
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
    font: string;
    light: {
      shadow: string;
      background: string;
      card: string;
      border: string;
      accent: string;
      text: string;
    };
    dark: {
      shadow: string;
      background: string;
      card: string;
      border: string;
      accent: string;
      text: string;
    };
  };
  messages: {
    placeholder: string;
  };
}

export type StyleVariant =
  | ".light"
  | ".dark"
  | ":hover"
  | ":focus"
  | ":active"
  | "::before"
  | "::after"
  | "::placeholder"
  | "<640px";
export type StyleDeclaration =
  & {
    [P in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[P] extends string
      ? CSSStyleDeclaration[P]
      : never;
  }
  & { [k in StyleVariant]?: StyleDeclaration };
