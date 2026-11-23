import { createHandler } from "./handler";
import type { Request } from "./types";

const handle = createHandler();
self.onmessage = async ({ data }: MessageEvent<Request & { id: number }>) => {
  // runs psyche in a worker so typing never waits on matching
  self.postMessage({ id: data.id, response: await handle(data) });
};
