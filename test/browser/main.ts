import { run } from "./harness";

// every *.browser.ts registers its tests on import, then all run in order
import.meta.glob("./*.browser.ts", { eager: true });

(window as Window & { __psyche?: ReturnType<typeof run> }).__psyche = run();
