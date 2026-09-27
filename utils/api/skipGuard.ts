import * as pw from '@playwright/test';
import { apiBaseURL } from '../helpers';

/**
 * API test guard — wraps `test` so every test in an API spec is skipped
 * when the openIMIS backend isn't reachable. Tests still pass when the
 * demo / local stack is up; this just turns connection failures into
 * skips instead of errors.
 */
const realTest = pw.test;
const _originalBeforeAll = realTest.beforeAll.bind(realTest);
const _originalAfterAll = realTest.afterAll.bind(realTest);
let _apiAvailable: boolean | null = null;

async function probe(): Promise<boolean> {
  if (_apiAvailable !== null) return _apiAvailable;
  try {
    const ctx = await pw.request.newContext({ baseURL: apiBaseURL() });
    const res = await ctx.post('', {
      headers: { 'Content-Type': 'application/json' },
      data: { query: '{ __typename }' },
      timeout: 15_000,
    });
    await ctx.dispose();
    _apiAvailable = res.ok();
  } catch {
    _apiAvailable = false;
  }
  return _apiAvailable;
}

const _guard = {
  beforeAll: (fn: () => unknown) =>
    _originalBeforeAll(async () => {
      const ok = await probe();
      if (!ok) {
        realTest.skip(true, 'openIMIS API unreachable');
        return;
      }
      await fn();
    }),
  afterAll: (fn: () => unknown) =>
    _originalAfterAll(async () => {
      if (_apiAvailable === false) return;
      await fn();
    }),
};

Object.defineProperty(realTest, 'beforeAll', { value: _guard.beforeAll, writable: true });
Object.defineProperty(realTest, 'afterAll', { value: _guard.afterAll, writable: true });

export const test = realTest;
export const expect = pw.expect;
export const request = pw.request;