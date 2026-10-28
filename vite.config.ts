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
  plugins: [
    {
      // psyche's worker, referred to by a constant in the store, so this build
      // leaves it be, then written literally beside the store, as a site's
      // bundler finds a worker by `new Worker(new URL("...", import.meta.url))`
      name: "psyche:worker-url",
      renderChunk(code) {
        const url = /new URL\((?:WORKER_URL|"\.\/worker\.ts"), import\.meta\.url\)/g;
        if (!code.includes("WORKER_URL") && !url.test(code)) return;
        const written = code
          .replace(url, 'new URL("./worker.js", import.meta.url)')
          .replace(/^(?:var|const) WORKER_URL = "\.\/worker\.ts";\n/m, "");
        if (written.includes("WORKER_URL") || !written.includes('new URL("./worker.js"'))
          this.error("psyche's worker url wasn't written as ./worker.js");
        return written;
      },
    },
  ],
});
