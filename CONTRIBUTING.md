# openIMIS Playwright Framework — Architecture Guide

This document is for engineers extending the test suite. Reading time: 10 minutes.

## Three-layer test pyramid

```
       UI tests (tests/ui)
         /             \
        /  Real browser \
       /  via POM (Page \
      /   Object Model)  \
API tests (tests/api)   Database tests
  - GraphQL               (tests/database)
  - REST (DRF)            - PostgreSQL
  - FHIR R4               - pg driver
        \                 /
         \               /
          Integration tests
          (tests/integration)
          - UI↔API↔DB
          - Prove the whole stack works together
```

**UI tests** drive the SPA via Playwright with the Page Object Model in `pages/`.

**API tests** hit GraphQL + REST + FHIR with the helpers in `utils/api/`. They
get their own JWT per test so they can run in parallel safely.

**Database tests** talk directly to PostgreSQL with the helpers in
`utils/db/`. They verify that what the API/UI claims to have done actually
persisted to the schema.

**Integration tests** combine layers — e.g. create via the API, verify in
the DB, then load the UI and confirm the new row shows up in the searcher.

## Conventions

### Page Object Model

Every Page Object extends [`BasePage`](pages/BasePage.ts) and:

- exposes locators as `readonly` properties (`addButton`, `searchInput`, …)
- exposes high-level actions (`openAddForm()`, `submitForm()`, `pickSelect(...)`)
- never asserts anything itself — assertions live in the test
- selects with Material UI classes + `name=` attributes (the most stable selectors for openIMIS)

### API tests

Every API test:

1. Calls `authedRequest(apiBaseURL())` to get a fresh `ctx` + `auth`
2. Uses the helpers in `utils/api/graphqlClient.ts` (`gqlQuery`, `gqlMutate`)
3. Uses queries from `utils/api/queries.ts` and payloads from `utils/api/payloads.ts`
4. Disposes the context in a `finally` block (or relies on Playwright teardown)

### Database tests

Every DB test:

1. Uses the typed helpers in `utils/db/dbAssertions.ts` (`countInsurees`, `getInsureeByChfId`, …)
2. Calls `close()` in an `afterAll` hook to release the connection pool
3. Filters by `ValidityTo IS NULL` (the audit pattern)
4. Never writes — all DB tests are read-only verifications

### Integration tests

These tests are opt-in: they require both a reachable API and a reachable
DB. They skip when either is missing so the rest of the suite still runs.

## Adding a new test

### UI

1. Open or create the relevant Page Object in `pages/`
2. Add locators + actions if needed
3. Create a new `tests/ui/<feature>.spec.ts`
4. Use Playwright's `test, expect` — never call `expect` inside a Page Object

### API

1. If you're testing a new query, add the GraphQL string to `utils/api/queries.ts`
2. If you're testing a new mutation, add a payload builder to `utils/api/payloads.ts`
3. Add a test to the right `tests/api/graphql-<entity>.spec.ts` or create a new one

### Database

1. If you're testing a new table, add a typed helper to `utils/db/dbAssertions.ts`
2. Create or extend the right `tests/database/<entity>-db.spec.ts`

## Running tests

```bash
npm run test:ui         # browser tests (slowest)
npm run test:api        # GraphQL + REST + FHIR
npm run test:db         # PostgreSQL
npm test                # everything
```

## CI

The GitHub Actions workflow at `.github/workflows/ci.yml` runs the three
surfaces in parallel jobs. The DB job spins up `ghcr.io/openimis/openimis-pgsql`
automatically. Override credentials via repo secrets in production deployments.