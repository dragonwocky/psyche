// psyche's search worker, which createSearch starts, so typing never waits on
// matching: it fetches and keeps the index and answers the store's requests,
// by their id, as { id, response }
import { createHandler, type Request } from "./handler";

const handle = createHandler();
self.onmessage = async ({ data }: MessageEvent<Request & { id: number }>) => {
  self.postMessage({ id: data.id, response: await handle(data) });
};
