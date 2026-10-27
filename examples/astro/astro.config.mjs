import solid from "@astrojs/solid-js";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [solid()],
  // psyche is linked from ../.. here, with its own solid-js: a site installs
  // one copy, which psyche's signals must share
  vite: { resolve: { dedupe: ["solid-js"] } },
});
