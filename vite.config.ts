import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

// a library build: one entry per export, with solid's jsx compiled for the
// browser, and solid and lucide left to the site, so its signals (and icons)
// are shared with the site's own copy
export default defineConfig({
  plugins: [solid({ solid: { generate: "dom" } })],
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
        client: "src/client.ts",
        worker: "src/worker.ts",
      },
    },
    rolldownOptions: {
      external: [/^solid-js($|\/)/, /^lucide-solid($|\/)/],
    },
  },
});
