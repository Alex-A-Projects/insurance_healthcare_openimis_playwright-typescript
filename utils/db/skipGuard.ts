import * as pw from '@playwright/test';
import { pingDb } from './pgClient';

/**
 * DB test guard — wraps `test` so every test in a DB spec is skipped
 * when PostgreSQL isn't reachable. Tests still pass when the DB is
 * available; this just turns connection failures into skips instead
 * of errors.
 */
const realTest = pw.test;
const _originalBeforeAll = realTest.beforeAll.bind(realTest);
const _originalAfterAll = realTest.afterAll.bind(realTest);
let _dbAvailable: boolean | null = null;

async function probe(): Promise<boolean> {
  if (_dbAvailable !== null) return _dbAvailable;
  _dbAvailable = await pingDb();
  return _dbAvailable;
}

const _guard = {
  beforeAll: (fn: () => unknown) =>
    _originalBeforeAll(async () => {
      const ok = await probe();
      if (!ok) {
        realTest.skip(true, 'PostgreSQL unreachable');
        return;
      }
      await fn();
    }),
  afterAll: (fn: () => unknown) =>
    _originalAfterAll(async () => {
      if (_dbAvailable === false) return;
      await fn();
    }),
};

Object.defineProperty(realTest, 'beforeAll', { value: _guard.beforeAll, writable: true });
Object.defineProperty(realTest, 'afterAll', { value: _guard.afterAll, writable: true });

export const test = realTest;
export const expect = pw.expect;
export const request = pw.request;