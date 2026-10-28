// a small synthetic index for the browser tests
type Page = {
  title: string;
  body: string;
  authors?: string[];
  categories?: string[];
  headings?: { value: string; href: string }[];
  section?: string;
  entry?: number;
};

const FIELDS = [
  { key: "title", tier: 3 },
  { key: "headings", tier: 2.5 },
  { key: "authors", tier: 2 },
  { key: "categories", tier: 2 },
  { key: "body", tier: 1 },
] as const;

const pages: (Page & { href: string })[] = [
  { href: "/", title: "Home", body: "Welcome to the garden", section: "Pages" },
  {
    href: "/posts/kale",
    title: "Growing kale",
    body: "Kale grows through the cold months.",
    authors: ["Alice"],
    categories: ["Gardening"],
    section: "Posts",
    headings: [{ value: "Preparing the soil", href: "#soil" }],
  },
  {
    href: "/posts/garlic",
    title: "Planting garlic",
    body: "Garlic goes in before winter.",
    section: "Posts",
  },
  { href: "/media?entry=1", title: "Kale podcast", body: "", entry: 1 },
];

// the index's entries: each page linked to its href
const index = pages.map(({ href, ...value }) => ({ href, value }));

export { FIELDS, index, type Page };
