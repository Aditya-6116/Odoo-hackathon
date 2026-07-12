#!/usr/bin/env python3
"""
Import AssetFlow seed data (../json/*.json) into Firestore using the Firebase Admin SDK.

Setup:
    pip install firebase-admin
    # Download a service account key from Firebase Console > Project Settings > Service Accounts
    # and save it as serviceAccountKey.json next to this script (never commit it to git).

Usage:
    python3 import_to_firestore.py                      # imports every collection
    python3 import_to_firestore.py --only assets users   # imports just these collections
    python3 import_to_firestore.py --emulator            # targets the local Firestore emulator instead
    python3 import_to_firestore.py --wipe                # deletes existing docs in each collection first

Notes:
- Document IDs in the JSON files (the "id" / "uid" field) are used as the Firestore document ID,
  so re-running the import is idempotent (it overwrites, not duplicates).
- ISO-8601 timestamp strings are converted to native Firestore Timestamps automatically.
- For `users`, the doc ID used is `uid` (per the schema: "Document ID = Firebase Auth uid").
  This script does NOT create matching Firebase Auth accounts — pair it with a small Auth-seeding
  script (or the emulator's Auth import) if you need working logins for the seeded users.
"""

import argparse
import json
import os
import re
import sys

ISO_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")

# Collection name -> field to use as the Firestore document ID
DOC_ID_FIELD = {
    "users": "uid",
}
DEFAULT_ID_FIELD = "id"

# Import order matters only for readability here — Firestore has no FK constraints,
# but this mirrors the dependency order in the schema doc.
COLLECTION_ORDER = [
    "departments", "users", "assetCategories", "assets", "allocations",
    "transferRequests", "bookings", "maintenanceRequests", "auditCycles",
    "auditItems", "discrepancyReports", "notifications", "activityLogs",
]


def convert_timestamps(obj):
    """Recursively convert ISO-8601 'Z' strings into datetime objects Firestore stores as Timestamps."""
    from datetime import datetime, timezone
    if isinstance(obj, dict):
        return {k: convert_timestamps(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_timestamps(v) for v in obj]
    if isinstance(obj, str) and ISO_RE.match(obj):
        return datetime.strptime(obj, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    return obj


def main():
    parser = argparse.ArgumentParser(description="Import AssetFlow seed data into Firestore.")
    parser.add_argument("--only", nargs="*", help="Only import these collection names.")
    parser.add_argument("--emulator", action="store_true", help="Target the local Firestore emulator.")
    parser.add_argument("--emulator-host", default="localhost:8080", help="Emulator host:port.")
    parser.add_argument("--wipe", action="store_true", help="Delete all existing docs in each target collection first.")
    parser.add_argument("--project-id", default=None, help="GCP project ID (needed for emulator mode).")
    args = parser.parse_args()

    if args.emulator:
        os.environ["FIRESTORE_EMULATOR_HOST"] = args.emulator_host

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        sys.exit("Missing dependency. Run: pip install firebase-admin")

    if not firebase_admin._apps:
        if args.emulator:
            firebase_admin.initialize_app(options={"projectId": args.project_id or "assetflow-demo"})
        else:
            key_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
            if not os.path.exists(key_path):
                sys.exit(f"serviceAccountKey.json not found at {key_path}. "
                         f"Download it from Firebase Console > Project Settings > Service Accounts, "
                         f"or use --emulator to target the local emulator instead.")
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)

    db = firestore.client()
    json_dir = os.path.join(os.path.dirname(__file__), "..", "json")

    targets = args.only if args.only else COLLECTION_ORDER
    for name in targets:
        path = os.path.join(json_dir, f"{name}.json")
        if not os.path.exists(path):
            print(f"  [skip] {name}: no file at {path}")
            continue

        with open(path) as f:
            records = json.load(f)

        if args.wipe:
            existing = list(db.collection(name).stream())
            batch = db.batch()
            for i, doc in enumerate(existing, start=1):
                batch.delete(doc.reference)
                if i % 400 == 0:
                    batch.commit()
                    batch = db.batch()
            batch.commit()
            print(f"  [wiped] {name}: removed {len(existing)} existing docs")

        id_field = DOC_ID_FIELD.get(name, DEFAULT_ID_FIELD)
        batch = db.batch()
        count = 0
        for record in records:
            doc_id = record[id_field]
            data = convert_timestamps({k: v for k, v in record.items() if k != id_field or name != "users"})
            # keep 'id'/'uid' field in the doc too, since the schema expects e.g. users.uid to exist
            ref = db.collection(name).document(doc_id)
            batch.set(ref, data)
            count += 1
            if count % 400 == 0:  # Firestore batch limit is 500
                batch.commit()
                batch = db.batch()
        batch.commit()
        print(f"  [ok] {name}: imported {count} docs")

    print("\nImport complete.")


if __name__ == "__main__":
    main()
