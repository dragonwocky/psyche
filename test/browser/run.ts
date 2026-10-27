// runs the browser tests (test/browser/*.browser.ts) in headless chrome, driven
// over the devtools protocol: CHROME sets the executable, otherwise chrome or
// chromium on the PATH, or windows chrome from WSL
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createServer } from "vite";
import solid from "vite-plugin-solid";

import type { Outcome } from "./harness";

const WSL_CHROME = "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe",
  findChrome = () => {
    if (process.env.CHROME) return process.env.CHROME;
    for (const dir of (process.env.PATH ?? "").split(":"))
      for (const name of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"])
        if (existsSync(join(dir, name))) return join(dir, name);
    if (existsSync(WSL_CHROME)) return WSL_CHROME;
    throw new Error("chrome not found, set CHROME to its executable");
  },
  // windows chrome needs a windows profile path
  profile = (chrome: string) =>
    chrome.endsWith(".exe")
      ? `C:\\Windows\\Temp\\psyche-chrome-${process.pid}`
      : mkdtempSync(join(tmpdir(), "psyche-chrome-")),
  sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "warn",
  plugins: [solid()],
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const address = server.httpServer!.address() as { port: number },
  page = `http://127.0.0.1:${address.port}/`;

const chrome = findChrome(),
  debugPort = 9300 + (process.pid % 500),
  browser = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile(chrome)}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

let exitCode = 1;
try {
  let url: string | undefined;
  for (let i = 0; i < 60 && !url; i++) {
    url = await fetch(`http://127.0.0.1:${debugPort}/json/version`)
      .then((res) => res.json() as Promise<{ webSocketDebuggerUrl: string }>)
      .then((json) => json.webSocketDebuggerUrl)
      .catch(() => sleep(250).then(() => undefined));
  }
  if (!url) throw new Error("chrome's devtools didn't start");

  const socket = new WebSocket(url),
    pending = new Map<
      number,
      (message: { result?: unknown; error?: { message: string } }) => void
    >();
  let ids = 0;
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.id) pending.get(message.id)?.(message);
    else if (message.method === "Runtime.exceptionThrown")
      console.error(message.params.exceptionDetails.exception?.description);
    else if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error")
      console.error(
        ...message.params.args.map(
          (arg: { value?: unknown; description?: string }) => arg.value ?? arg.description,
        ),
      );
  };
  const send = <T>(method: string, params: object = {}, sessionId?: string) =>
    new Promise<T>((resolve, reject) => {
      const id = ++ids;
      pending.set(id, ({ result, error }) =>
        error ? reject(new Error(error.message)) : resolve(result as T),
      );
      socket.send(JSON.stringify({ id, method, params, sessionId }));
    });

  const { targetId } = await send<{ targetId: string }>("Target.createTarget", {
      url: "about:blank",
    }),
    { sessionId } = await send<{ sessionId: string }>("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
  await send("Runtime.enable", {}, sessionId);
  await send("Page.navigate", { url: page }, sessionId);

  let outcomes: Outcome[] | undefined;
  for (let i = 0; i < 120 && !outcomes; i++) {
    const { result } = await send<{ result: { value?: Outcome[] } }>(
      "Runtime.evaluate",
      { expression: "window.__psyche", awaitPromise: true, returnByValue: true },
      sessionId,
    );
    outcomes = result.value ?? (await sleep(250), undefined);
  }
  if (!outcomes) throw new Error("the tests didn't run");

  for (const { name, error } of outcomes)
    console.log(error ? `✗ ${name}\n    ${error}` : `✓ ${name}`);
  const failed = outcomes.filter(({ error }) => error).length;
  console.log(`\n${outcomes.length - failed} passed, ${failed} failed`);
  exitCode = failed || !outcomes.length ? 1 : 0;
  await send("Browser.close").catch(() => {});
} catch (error) {
  console.error(error);
} finally {
  browser.kill();
  await server.close();
}
process.exit(exitCode);
