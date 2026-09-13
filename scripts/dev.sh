#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PB_BIN="${ROOT_DIR}/pocketbase/pocketbase"
PB_DATA_DIR="${ROOT_DIR}/pocketbase/pb_data"
MIGRATIONS_DIR="${ROOT_DIR}/pocketbase/pb_migrations"
HOOKS_DIR="${ROOT_DIR}/pocketbase/pb_hooks"

cd "${ROOT_DIR}"

# Load .env (BGG_TOKEN, etc.) into this process's environment so PocketBase's hooks can
# read it via $os.getenv - without ever echoing it. `set -a` exports every var sourced
# below; `set +a` turns that back off so we don't export unrelated shell vars afterwards.
if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "${ROOT_DIR}/.env"
  set +a
fi

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

"${PB_BIN}" serve --dev --dir "${PB_DATA_DIR}" --hooksDir "${HOOKS_DIR}" &
PB_PID=$!

echo "PocketBase running (PID ${PB_PID}). Starting SvelteKit dev server..."

npm run dev:vite
