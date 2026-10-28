// the site search's matching, off the main thread so typing never waits on it.
// a site's worker module calls createSearchWorker, which fetches and keeps the
// index and answers the store's requests, see createSearch
import { createHandler, type Request, type WorkerOptions } from "./handler";

// requests are answered by their id, as { id, response }
const createSearchWorker = <T extends Record<string, unknown> = Record<string, unknown>>(
  options?: WorkerOptions<T>,
) => {
  const handle = createHandler(options);
  self.onmessage = async ({ data }: MessageEvent<Request & { id: number }>) => {
    const response = await handle(data);
    self.postMessage({ id: data.id, response });
  };
};

export { createSearchWorker, type WorkerOptions };
export type { Result } from "./handler";
