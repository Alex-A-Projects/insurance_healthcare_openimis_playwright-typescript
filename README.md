# openIMIS Playwright + TypeScript Test Suite

A comprehensive end-to-end automation framework for [openIMIS](https://openimis.org/) — the open-source insurance and healthcare management information system.

| Surface | Directory | What it tests |
| --- | --- | --- |
| **UI** | [tests/ui/](tests/ui/) | Browser-driven tests using Page Object Model against the React/Material UI demo at https://demo.openimis.org |
| **API** | [tests/api/](tests/api/) | Direct GraphQL (`/api/graphql`) and REST calls — schema-tolerant smoke tests |
| **Database** | [tests/database/](tests/database/) | Direct PostgreSQL assertions against the Django `tbl*` schema |

---

## Stack

- [Playwright Test](https://playwright.dev/) `^1.48` (browser + API automation)
- TypeScript `^5.4` (strict mode)
- [`pg`](https://www.npmjs.com/package/pg) — PostgreSQL client for DB tests
- [Docker](https://www.docker.com/) + `ghcr.io/openimis/openimis-pgsql:develop` — local DB

## Quick start

### Option A — UI + API only (no local DB)

```bash
npm install
npm run install:browsers
cp .env.example .env
npm run test:ui       # UI tests (~50)
npm run test:api      # API tests (36)
```

### Option B — Include DB tests

```bash
docker compose up -d          # starts openIMIS PG locally
npm test                       # UI + API + DB
docker compose down -v         # tear down
```

Or use the helper script: `./scripts/start-test-db.sh` (flags: `--start`, `--stop`, `--logs`).

## Configuration (.env.example)

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENIMIS_BASE_URL` | `https://demo.openimis.org` | Frontend |
| `OPENIMIS_API_BASE_URL` | `${OPENIMIS_BASE_URL}/api` | REST + GraphQL + FHIR |
| `OPENIMIS_USERNAME` / `OPENIMIS_PASSWORD` | `Admin` / `admin123` | Demo creds |
| `PG_HOST` / `PG_PORT` / `PG_DATABASE` / `PG_USER` / `PG_PASSWORD` | `localhost` / `5432` / `test_imis` / `IMISuser` / `IMISuser@1234` | PostgreSQL |

## API surface

- **GraphQL** — `POST /api/graphql`, Relay-style pagination, `Authorization: JWT <token>` (note: `JWT`, not `Bearer`).
- **REST** — `POST /api/login` (legacy), `GET /api/core/users/current_user/`.
- **FHIR R4** — `/api/fhir/*` (optional; tests skip if the module isn't installed).

## Conventions

- Page Objects extend `BasePage`; tests use `request` fixture for API, `pg.Pool` for DB.
- Tests skip (rather than fail) when infrastructure is unreachable — see the `[smoke] Skipping — ...` log lines.
- See [CONTRIBUTING.md](CONTRIBUTING.md) for the test pyramid architecture guide.