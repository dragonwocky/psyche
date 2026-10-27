// a small synthetic index for the browser tests
type Page = {
  href: string;
  title: string;
  body: string;
  authors?: string[];
  categories?: string[];
  headings?: { value: string; id: string }[];
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

const records: Page[] = [
  { href: "/", title: "Home", body: "Welcome to the garden", section: "Pages" },
  {
    href: "/posts/kale",
    title: "Growing kale",
    body: "Kale grows through the cold months.",
    authors: ["Alice"],
    categories: ["Gardening"],
    section: "Posts",
    headings: [{ value: "Preparing the soil", id: "soil" }],
  },
  {
    href: "/posts/garlic",
    title: "Planting garlic",
    body: "Garlic goes in before winter.",
    section: "Posts",
  },
  { href: "/media?entry=1", title: "Kale podcast", body: "", entry: 1 },
];

export { FIELDS, type Page, records };
