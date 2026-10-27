// the site's content, rendered by its pages and indexed by search.json
const posts = [
  {
    slug: "kale",
    title: "Growing kale",
    authors: ["Alice Nguyen"],
    categories: ["Vegetables"],
    sections: [
      { id: "sowing", heading: "Sowing", text: "Sow kale in late summer, a finger's depth apart." },
      {
        id: "frost",
        heading: "After a frost",
        text: "Kale sweetens after the first frost of winter.",
      },
    ],
  },
  {
    slug: "garlic",
    title: "Planting garlic",
    authors: ["Sam Okafor"],
    categories: ["Bulbs"],
    sections: [
      {
        id: "cloves",
        heading: "Planting cloves",
        text: "Garlic goes in before winter, pointed end up.",
      },
    ],
  },
];

export { posts };
