import lume from "@lumeland/lume";
import esbuild from "@lumeland/plugin-esbuild";

const site = lume();

// main.ts mounts psyche's default search panel, and search.worker.ts runs its
// matching. esbuild bundles both, with psyche's (precompiled) solid components
site.add("/main.ts");
site.add("/search.worker.ts");
// psyche's precompiled tailwind styles, for a site without tailwind
site.copy(import.meta.resolve("psyche/styles.css"), "/psyche.css");
site.use(esbuild());

export default site;
