# AssetFlow — Backend Testing Dataset

Deterministic seed data for every Firestore collection in the AssetFlow schema, generated
with a fixed random seed (`42`) so it's reproducible across machines/environments. Re-running
`scripts/generate_seed_data.py` produces byte-for-byte the same output.

## What's inside

```
seed_data/
├── json/                  ← one file per collection, nested structure, ready for Firestore import
├── csv/                   ← same data flattened (nested fields as JSON strings), for Excel/Sheets
├── scripts/
│   ├── generate_seed_data.py       ← regenerate everything from scratch
│   ├── import_to_firestore.py      ← push json/*.json into Firestore (Admin SDK or emulator)
│   └── export_from_firestore.py    ← pull live Firestore data back out, same layout
└── README.md
```

## Document counts

| Collection | Count | Notes |
|---|---:|---|
| `departments` | 10 | 2 have a `parentDepartmentId` (simple hierarchy) |
| `users` | 50 | 1 admin · 4 asset_managers · 10 department_heads (1/dept) · 35 employees |
| `assetCategories` | 12 | Each with realistic `customFields`; 1 marked `inactive` (legacy-category edge case) |
| `assets` | 250 | Covers all 7 lifecycle statuses — see distribution below |
| `allocations` | 100 | 73 active · 15 overdue · 12 returned |
| `transferRequests` | 30 | Mix of requested/approved/rejected/completed |
| `bookings` | 40 | Only on `isBookable` assets; non-overlapping per asset |
| `maintenanceRequests` | 35 | Every "Under Maintenance" asset has a matching open request |
| `auditCycles` | 4 | 2 Closed, 2 Open |
| `auditItems` | 250 | Spread across the 4 cycles (90/70/50/40) |
| `discrepancyReports` | 2 | One per *closed* cycle that had flagged items (per schema: "one doc per cycle") |
| `notifications` | 300 | All 9 notification types represented |
| `activityLogs` | 600 | Spans ~2 years, covers every major action type |

### Asset status distribution (250 total)
`Available` 95 · `Allocated` 88 · `Retired` 22 · `Under Maintenance` 20 · `Disposed` 10 · `Reserved` 8 · `Lost` 7

## Referential integrity guarantees

- Every `Allocated` asset has exactly one matching `active`/`overdue` allocation whose
  `allocatedToId`/`Type`/`Name` match the asset's `currentHolder*` fields (no orphaned "current holder" state).
- Every department has exactly one `headUserId` pointing to a real `department_head` user, and that
  department's `headUserName` is denormalized correctly.
- `transferRequests.currentAllocationId` always points to a real `active`/`overdue` allocation.
- `bookings` only reference assets with `isBookable: true`, and bookings on the same asset don't overlap in time.
- `maintenanceRequests`: every asset currently `Under Maintenance` has an open (non-`Resolved`) request.
- `auditItems.auditCycleId` / `assetId` always resolve to real docs; `discrepancyReports.flaggedItems`
  is built directly from that cycle's `Missing`/`Damaged` audit items.
- All denormalized display fields (`assetTag`, `categoryName`, `departmentName`, `allocatedToName`, etc.)
  match their source document at generation time, exactly as the schema's "denormalize for display" pattern expects.

## Regenerating

```bash
pip install faker
python3 scripts/generate_seed_data.py
```

Change `SEED` at the top of the script for a different random dataset, or edit the count
constants (`N_ASSETS`, `TOTAL_USERS`, the `items_per_cycle` list, etc.) to resize it.

## Importing into Firestore

```bash
pip install firebase-admin

# Option A — real Firestore project
# 1. Firebase Console > Project Settings > Service Accounts > Generate new private key
# 2. Save it as scripts/serviceAccountKey.json (already gitignored-worthy — don't commit it)
python3 scripts/import_to_firestore.py

# Option B — local emulator (no credentials needed)
firebase emulators:start --only firestore   # in another terminal
python3 scripts/import_to_firestore.py --emulator

# Re-import cleanly (wipes each target collection first)
python3 scripts/import_to_firestore.py --wipe

# Import just a subset while iterating
python3 scripts/import_to_firestore.py --only assets allocations
```

**Note on `users` and Firebase Auth:** the schema uses the Firebase Auth `uid` as the Firestore
document ID for `users`. This seed data generates realistic `uid_XXXX` values and uses them
consistently everywhere they're referenced, but it does **not** create matching Firebase Auth
accounts — there's no login-able account behind these users out of the box. If you need working
test logins, seed matching Auth accounts separately (e.g. via the Auth emulator's import, or a
small script using `auth.create_user(uid=..., email=...)` for each `users` doc) before or after
running this import.

## Exporting (round-trip / snapshot)

```bash
python3 scripts/export_from_firestore.py            # writes to seed_data/export/
python3 scripts/export_from_firestore.py --emulator
```

Useful for grabbing a snapshot of whatever state your test/QA pass left the emulator in.
