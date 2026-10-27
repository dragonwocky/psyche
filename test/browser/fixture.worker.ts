import { createSearchWorker } from "../../src/worker";
import { type Page, records } from "./fixture";

createSearchWorker<Page>({ index: async () => records, sitemap: (record) => !record.entry });
