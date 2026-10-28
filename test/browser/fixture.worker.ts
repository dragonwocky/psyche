import { createSearchWorker } from "../../src/worker";
import { index, type Page } from "./fixture";

createSearchWorker<Page>({ index: async () => index, sitemap: ({ value }) => !value.entry });
