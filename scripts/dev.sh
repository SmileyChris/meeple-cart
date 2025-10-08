#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PB_BIN="${ROOT_DIR}/pocketbase/pocketbase"
DATA_DIR="${ROOT_DIR}/pocketbase/pb_data"
MIGRATIONS_DIR="${ROOT_DIR}/services/pocketbase/migrations"

if [[ ! -x "${PB_BIN}" ]]; then
  echo "PocketBase binary not found; downloading..."
  "${ROOT_DIR}/scripts/download-pocketbase.sh"
fi

echo "Running PocketBase migrations..."
"${PB_BIN}" migrate up --dir "${DATA_DIR}" --migrationsDir "${MIGRATIONS_DIR}"

declare PB_PID=""
cleanup() {
  if [[ -n "${PB_PID}" ]] && kill -0 "${PB_PID}" 2>/dev/null; then
    kill "${PB_PID}" 2>/dev/null || true
    wait "${PB_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

"${PB_BIN}" serve --dir "${DATA_DIR}" &
PB_PID=$!

echo "PocketBase running (PID ${PB_PID}). Starting SvelteKit dev server..."

npm run dev
