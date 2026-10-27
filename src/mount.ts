import { render } from "solid-js/web";

import Search, { type SearchProps } from "./Search";

// renders the default <Search> into a new element, for sites that don't
// render solid components themselves (e.g. a lume site's client script)
const mount = <Meta = unknown>(props: SearchProps<Meta> = {}, $parent: Element = document.body) => {
  const $root = document.createElement("div"),
    dispose = render(() => Search(props), $root);
  $parent.append($root);
  return () => {
    dispose();
    $root.remove();
  };
};

export { mount };
