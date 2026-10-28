import lume from "@lumeland/lume";
import esbuild from "@lumeland/plugin-esbuild";

const site = lume();

// main.ts renders the site's search panel from psyche's state, and
// search.worker.ts is psyche's worker, which main.ts starts by its url, as
// esbuild doesn't bundle a worker it finds by one. esbuild bundles both
site.add("/main.ts");
site.add("/search.worker.ts");
site.use(esbuild());

export default site;
