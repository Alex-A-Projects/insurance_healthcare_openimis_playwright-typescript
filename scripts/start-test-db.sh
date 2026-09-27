#!/usr/bin/env bash
# Start the openIMIS test PostgreSQL via Docker Compose.
# Then run the database tests.
#
# Usage:
#   ./scripts/start-test-db.sh           # start DB + run tests
#   ./scripts/start-test-db.sh --stop    # stop + remove the container
#   ./scripts/start-test-db.sh --logs    # tail logs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

if [ "$1" = "--stop" ]; then
  echo "Stopping openIMIS test PostgreSQL..."
  docker compose down -v
  exit 0
fi

if [ "$1" = "--logs" ]; then
  docker compose logs -f postgres
  exit 0
fi

echo "Starting openIMIS test PostgreSQL via docker compose..."
docker compose up -d

echo "Waiting for PostgreSQL to become healthy..."
for i in {1..60}; do
  if docker inspect --format='{{.State.Health.Status}}' openimis-test-postgres 2>/dev/null | grep -q healthy; then
    echo "PostgreSQL is healthy."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "PostgreSQL did not become healthy in 60s. Run 'docker compose logs postgres' to debug."
    exit 1
  fi
  sleep 1
done

echo ""
echo "Running database tests against openIMIS PostgreSQL..."
echo "(if you have a fresh schema with no rows, most tests will skip via test.skip)"
echo ""
export PG_HOST=localhost
export PG_PORT=5432
export PG_DATABASE=test_imis
export PG_USER=IMISuser
export PG_PASSWORD=IMISuser@1234

npm run test:db
