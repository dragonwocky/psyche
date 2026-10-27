import { createSearch } from "psyche";

import workerUrl from "./search.worker?worker&url";

// the site's index records, and the fields searched in them, by tier
type Page = {
  href: string;
  title: string;
  body: string;
  headings?: { value: string; id: string }[];
  authors?: string[];
  categories?: string[];
  section?: string;
};

// one store, shared by the site's components: the panel, and tags on a page
const search = createSearch<Page>({
  worker: workerUrl,
  fields: [
    { key: "title", tier: 3 },
    { key: "headings", tier: 2.5 },
    { key: "authors", tier: 2 },
    { key: "categories", tier: 2 },
    { key: "body", tier: 1 },
  ],
  group: "section",
});

export { type Page, search };
