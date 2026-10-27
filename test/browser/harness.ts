// a minimal test harness for the browser, as vitest's needs a test provider:
// tests run in order in the page, see run.ts
type Test = { name: string; fn: () => unknown };
type Outcome = { name: string; error?: string };

const tests: Test[] = [];
let prefix: string[] = [];

const describe = (name: string, fn: () => void) => {
    prefix = [...prefix, name];
    fn();
    prefix = prefix.slice(0, -1);
  },
  test = (name: string, fn: () => unknown) =>
    tests.push({ name: [...prefix, name].join(" > "), fn });

const show = (value: unknown) => {
    try {
      return JSON.stringify(value) ?? String(value);
    } catch {
      return String(value);
    }
  },
  equal = (a: unknown, b: unknown): boolean => {
    if (Object.is(a, b)) return true;
    if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = (o: object) =>
      Object.keys(o).filter((k) => (o as Record<string, unknown>)[k] !== undefined);
    const ka = keys(a),
      kb = keys(b);
    return (
      ka.length === kb.length
      && ka.every((k) =>
        equal((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
      )
    );
  },
  expect = (actual: unknown) => {
    const check = (pass: boolean, message: string) => {
      if (!pass) throw new Error(message);
    };
    return {
      toBe: (expected: unknown) =>
        check(Object.is(actual, expected), `expected ${show(actual)} to be ${show(expected)}`),
      toEqual: (expected: unknown) =>
        check(equal(actual, expected), `expected ${show(actual)} to equal ${show(expected)}`),
      toBeUndefined: () => check(actual === undefined, `expected ${show(actual)} to be undefined`),
    };
  };

const run = async () => {
  const outcomes: Outcome[] = [];
  for (const { name, fn } of tests) {
    try {
      await fn();
      outcomes.push({ name });
    } catch (error) {
      outcomes.push({ name, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return outcomes;
};

export { describe, expect, run, test, type Outcome };
