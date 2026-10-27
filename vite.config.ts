import { defineConfig } from "vite";

// a library build: one entry per export, with solid left to the site, so the
// adapter's signals are the site's own copy's
export default defineConfig({
  build: {
    target: "es2022",
    minify: false,
    sourcemap: true,
    lib: {
      formats: ["es"],
      entry: {
        index: "src/index.ts",
        match: "src/match.ts",
        highlight: "src/highlight.ts",
        keys: "src/keys.ts",
        worker: "src/worker.ts",
        solid: "src/solid.ts",
      },
    },
    rolldownOptions: {
      external: [/^solid-js($|\/)/],
    },
  },
});
