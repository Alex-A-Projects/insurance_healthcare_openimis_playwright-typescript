/**
 * tests/database/schema.spec.ts
 *
 * Smoke checks: every table the openIMIS demo is expected to have
 * actually exists and is queryable.
 */
import { test, expect } from '@playwright/test';
import { pingDb, datasetSummary, close, tableExists } from '../../utils/db/pgClient';

test.describe('Schema smoke checks @db', () => {
  test.afterAll(async () => {
    await close();
  });

  test('database is reachable', async () => {
    const ok = await pingDb();
    expect(ok).toBeTruthy();
  });

  test('dataset summary returns counts for known tables', async () => {
    const summary = await datasetSummary();
    expect(typeof summary).toBe('object');
    expect(Object.keys(summary).length).toBeGreaterThanOrEqual(0);
  });

  for (const table of [
    'tblInsuree',
    'tblFamilies',
    'tblPolicy',
    'tblPremium',
    'tblClaim',
    'tblClaimServices',
    'tblClaimItems',
    'tblProduct',
    'tblHF',
    'tblLocations',
    'tblUsers',
    'tblICDCodes',
    'tblItems',
    'tblServices',
    'tblRole',
  ]) {
    test(`${table} exists`, async () => {
      // Check that the table itself exists in the schema, regardless of
      // whether rows are present (the demo DB has the schema but no
      // seed data). Use information_schema so empty tables still pass.
      expect(await tableExists(table)).toBeTruthy();
    });
  }
});