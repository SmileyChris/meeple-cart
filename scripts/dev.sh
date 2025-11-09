#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PB_BIN="${ROOT_DIR}/pocketbase/pocketbase"
PB_DATA_DIR="${ROOT_DIR}/pocketbase/pb_data"
MIGRATIONS_DIR="${ROOT_DIR}/pocketbase/pb_migrations"

cd "${ROOT_DIR}"

# Ensure we have the correct PocketBase version
"${ROOT_DIR}/scripts/download-pocketbase.sh"

mkdir -p "${PB_DATA_DIR}"

echo "Running PocketBase migrations..."
"${PB_BIN}" migrate up --dir "${PB_DATA_DIR}" --migrationsDir "${MIGRATIONS_DIR}"

declare PB_PID=""
cleanup() {
  if [[ -n "${PB_PID}" ]] && kill -0 "${PB_PID}" 2>/dev/null; then
    kill "${PB_PID}" 2>/dev/null || true
    wait "${PB_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

"${PB_BIN}" serve --dir "${PB_DATA_DIR}" &
PB_PID=$!

echo "PocketBase running (PID ${PB_PID}). Starting SvelteKit dev server..."

npm run dev
