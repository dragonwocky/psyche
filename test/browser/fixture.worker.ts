import { createSearchWorker } from "../../src/worker";
import { records } from "./fixture";

createSearchWorker({ index: async () => records });
