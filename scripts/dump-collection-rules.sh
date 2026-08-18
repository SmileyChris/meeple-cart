#!/usr/bin/env bash
# Applies every migration to a throwaway database and dumps the resulting collection rules
# to pocketbase/schema/effective-rules.json.
#
# This is the authoritative record of what PocketBase actually computes after all migrations
# have run, which is what src/lib/security/collection-rules.test.ts asserts against. Run it
# after changing any migration and commit the result.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

"${ROOT_DIR}/scripts/download-pocketbase.sh" >/dev/null

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

./pocketbase/pocketbase migrate up \
  --dir "${TMP_DIR}" \
  --migrationsDir pocketbase/pb_migrations >/dev/null

OUT="pocketbase/schema/effective-rules.json"
python3 - "${TMP_DIR}/data.db" "${OUT}" <<'PY'
import json, sqlite3, sys

db, out = sys.argv[1], sys.argv[2]
conn = sqlite3.connect(db)
rows = conn.execute(
    "select name, listRule, viewRule, createRule, updateRule, deleteRule, fields "
    "from _collections order by name"
).fetchall()

schema = {
    name: {
        "rules": {
            "listRule": l,
            "viewRule": v,
            "createRule": c,
            "updateRule": u,
            "deleteRule": d,
        },
        "fields": [
            {
                "name": f.get("name"),
                "type": f.get("type"),
                "required": bool(f.get("required")),
                **({"values": f["values"]} if f.get("values") else {}),
            }
            for f in json.loads(fields)
        ],
    }
    for name, l, v, c, u, d, fields in rows
    if not name.startswith("_")
}

with open(out, "w") as fh:
    json.dump(schema, fh, indent=2, sort_keys=True)
    fh.write("\n")

print(f"wrote {len(schema)} collections to {out}")
PY
