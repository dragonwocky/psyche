import MagicString from "magic-string";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    minify: true,
    sourcemap: true,
    lib: {
      formats: ["es"],
      entry: {
        index: "src/index.ts",
        worker: "src/worker.ts",
      },
    },
    rolldownOptions: {
      // merged into vite's minify options: Worker keeps its name, as a mangled
      // `new e(new URL(...))` isn't found as a worker, but inlined as an asset
      output: { minify: { mangle: { reserved: ["Worker"] } } },
    },
  },
  plugins: [
    {
      name: "psyche:worker-url",
      renderChunk(code) {
        const url = /new URL\((?:WORKER_URL|"\.\/worker\.ts"), import\.meta\.url\)/g;
        if (!code.includes("WORKER_URL") && !url.test(code)) return;
        const worker = new MagicString(code)
          .replace(url, 'new URL("./worker.js", import.meta.url)')
          .replace(/^(?:var|const) WORKER_URL = "\.\/worker\.ts";\n/m, "");
        return { code: worker.toString(), map: worker.generateMap({ hires: true }) };
      },
    },
  ],
});
