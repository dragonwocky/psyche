import type { PsycheRecord } from "../../src/match";

// a small synthetic index for the browser tests
const records: PsycheRecord<{ feed: number }>[] = [
  { href: "/", title: "Home", body: "Welcome to the garden", section: "Pages" },
  {
    href: "/posts/kale",
    title: "Growing kale",
    body: "Kale grows through the cold months.",
    authors: ["Alice"],
    categories: ["Gardening"],
    section: "Posts",
    headings: [{ id: "soil", text: "Preparing the soil" }],
  },
  {
    href: "/posts/garlic",
    title: "Planting garlic",
    body: "Garlic goes in before winter.",
    section: "Posts",
  },
  { href: "/media?entry=1", title: "Kale podcast", body: "", meta: { feed: 1 } },
];

export { records };
