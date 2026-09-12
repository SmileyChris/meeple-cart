# pocketbase/schema/pb_schema.json

This file is a **generated export** of the collections PocketBase computes after applying
every migration in `pocketbase/pb_migrations/`. It is not read by the app or by any test at
build/runtime — it exists as a human-readable snapshot of the schema for reference and code
review. `pocketbase/pb_migrations/` remains the single source of truth; if this file and the
migrations ever disagree, trust the migrations and regenerate this file.

Regenerate it whenever migrations change (new fields, new collections, renamed/removed
fields), so it stays a useful reference instead of going stale again.

## Regeneration steps

Run against a throwaway database on a non-default port — never against your real
`pocketbase/pb_data`:

```bash
# 1. Make sure the pinned PocketBase binary is present.
./scripts/download-pocketbase.sh

# 2. Apply every migration into a temp data dir.
TMP_DIR="$(mktemp -d)"
./pocketbase/pocketbase migrate up --dir "${TMP_DIR}" --migrationsDir pocketbase/pb_migrations

# 3. Create a throwaway superuser (PocketBase >= 0.23; use `admin create` on older versions).
./pocketbase/pocketbase superuser upsert schema-export@example.com "TempPass123!" --dir "${TMP_DIR}"

# 4. Serve on a non-default port so it never collides with a real dev server.
./pocketbase/pocketbase serve --dir "${TMP_DIR}" --http 127.0.0.1:8099 &
PB_PID=$!
sleep 2

# 5. Authenticate as the superuser and fetch every collection.
TOKEN=$(curl -s -X POST http://127.0.0.1:8099/api/collections/_superusers/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"schema-export@example.com","password":"TempPass123!"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")

curl -s "http://127.0.0.1:8099/api/collections?perPage=200" \
  -H "Authorization: ${TOKEN}" \
  | python3 -c "
import json, sys
items = json.load(sys.stdin)['items']
# Skip PocketBase's own system collections (_superusers, _authOrigins,
# _externalAuths, _mfas, _otps, ...) - this file documents the app's own
# schema, not PocketBase internals.
items = [c for c in items if not c['name'].startswith('_')]
items.sort(key=lambda c: c['name'])
json.dump({'collections': items}, sys.stdout, indent=2)
print()
" > pocketbase/schema/pb_schema.json

# 6. Stop the server and delete the temp dir.
kill "${PB_PID}"
rm -rf "${TMP_DIR}"
```

After regenerating, diff the collections against `src/lib/types/pocketbase.ts` (and the other
files under `src/lib/types/`) and add any fields the migrations define that the TypeScript
record types are missing. Do not remove fields from the TypeScript types just because they are
absent from the schema without checking why first — some drift is deliberate/in-flight work in
another branch.
