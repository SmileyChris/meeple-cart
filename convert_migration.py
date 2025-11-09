#!/usr/bin/env python3
"""Convert PocketBase migration from old API (db/dao) to new API (app)"""

import re
import sys

def convert_migration(content):
    # Replace migration function signatures
    content = content.replace('(db) => {', '(app) => {')

    # Remove Dao initialization lines
    content = re.sub(r'\s*const dao = new Dao\((db|app)\);?\n', '', content)

    # Replace dao methods with app methods
    content = content.replace('dao.saveCollection(', 'app.save(')
    content = content.replace('dao.deleteCollection(', 'app.delete(')
    content = content.replace('dao.findCollectionByNameOrId(', 'app.findCollectionByNameOrId(')

    # Remove the existingUsers check (not needed for fresh DB)
    # This removes lines 797-800 approximately
    content = re.sub(
        r'\s*const existingUsers = app\.findCollectionByNameOrId\([^\)]+\);.*?'
        r'\s*if \(existingUsers.*?\{.*?app\.delete\(existingUsers\);.*?\}',
        '',
        content,
        flags=re.DOTALL
    )

    return content

if __name__ == '__main__':
    input_file = sys.argv[1]
    output_file = sys.argv[2]

    with open(input_file, 'r') as f:
        content = f.read()

    converted = convert_migration(content)

    with open(output_file, 'w') as f:
        f.write(converted)

    print(f"✓ Converted {input_file} → {output_file}")
