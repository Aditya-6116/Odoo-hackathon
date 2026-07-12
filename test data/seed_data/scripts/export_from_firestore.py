#!/usr/bin/env python3
"""
Export live Firestore collections back to JSON (and CSV), matching the same
seed_data/json and seed_data/csv layout. Useful for pulling a snapshot of
whatever's in the emulator/project after you've been testing against it.

Setup:
    pip install firebase-admin
    # Place serviceAccountKey.json next to this script, or use --emulator

Usage:
    python3 export_from_firestore.py
    python3 export_from_firestore.py --only assets users
    python3 export_from_firestore.py --emulator
"""

import argparse
import csv
import json
import os
import sys

COLLECTIONS = [
    "departments", "users", "assetCategories", "assets", "allocations",
    "transferRequests", "bookings", "maintenanceRequests", "auditCycles",
    "auditItems", "discrepancyReports", "notifications", "activityLogs",
]


def serialize(value):
    """Make Firestore-native types (Timestamp, DocumentReference, GeoPoint) JSON-safe."""
    import datetime
    if isinstance(value, datetime.datetime):
        return value.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if isinstance(value, dict):
        return {k: serialize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [serialize(v) for v in value]
    return value


def flatten_for_csv(record):
    flat = {}
    for k, v in record.items():
        flat[k] = json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v
    return flat


def main():
    parser = argparse.ArgumentParser(description="Export Firestore collections to JSON/CSV.")
    parser.add_argument("--only", nargs="*", help="Only export these collection names.")
    parser.add_argument("--emulator", action="store_true", help="Read from the local Firestore emulator.")
    parser.add_argument("--emulator-host", default="localhost:8080")
    parser.add_argument("--project-id", default=None)
    parser.add_argument("--out-dir", default=os.path.join(os.path.dirname(__file__), "..", "export"))
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
                sys.exit(f"serviceAccountKey.json not found at {key_path}.")
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)

    db = firestore.client()
    json_out = os.path.join(args.out_dir, "json")
    csv_out = os.path.join(args.out_dir, "csv")
    os.makedirs(json_out, exist_ok=True)
    os.makedirs(csv_out, exist_ok=True)

    targets = args.only if args.only else COLLECTIONS
    for name in targets:
        docs = db.collection(name).stream()
        records = []
        for doc in docs:
            data = serialize(doc.to_dict())
            data["id"] = doc.id
            records.append(data)

        with open(os.path.join(json_out, f"{name}.json"), "w") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)

        csv_path = os.path.join(csv_out, f"{name}.csv")
        if records:
            flat = [flatten_for_csv(r) for r in records]
            fieldnames = sorted({k for r in flat for k in r.keys()})
            with open(csv_path, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(flat)
        else:
            open(csv_path, "w").close()

        print(f"  [ok] {name}: exported {len(records)} docs")

    print(f"\nExport complete -> {args.out_dir}")


if __name__ == "__main__":
    main()
