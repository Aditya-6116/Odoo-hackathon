#!/usr/bin/env python3
"""
AssetFlow — Backend Testing Dataset Generator
Deterministic (fixed seed) generator that produces realistic, internally-consistent
seed data for every Firestore collection in the AssetFlow schema, as both CSV and JSON.

Run: python3 generate_seed_data.py
Output: ./seed_data/csv/*.csv  and  ./seed_data/json/*.json
"""

import json
import csv
import random
import os
from datetime import datetime, timedelta, timezone
from faker import Faker

# ----------------------------------------------------------------------------
# 0. Setup — deterministic seed
# ----------------------------------------------------------------------------
SEED = 42
random.seed(SEED)
fake = Faker()
Faker.seed(SEED)

OUT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_DIR = os.path.join(OUT_DIR, "csv")
JSON_DIR = os.path.join(OUT_DIR, "json")
os.makedirs(CSV_DIR, exist_ok=True)
os.makedirs(JSON_DIR, exist_ok=True)

NOW = datetime(2026, 7, 12, 9, 0, 0, tzinfo=timezone.utc)  # "current" moment for the dataset


def iso(dt):
    if dt is None:
        return None
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def days_ago(n, jitter_hours=True):
    dt = NOW - timedelta(days=n)
    if jitter_hours:
        dt -= timedelta(hours=random.randint(0, 23), minutes=random.randint(0, 59))
    return dt


def days_from_now(n):
    return NOW + timedelta(days=n)


def new_id(prefix, n):
    return f"{prefix}_{n:04d}"


# ----------------------------------------------------------------------------
# Collections (in generation order, since later ones reference earlier ones)
# ----------------------------------------------------------------------------
departments = []
users = []
asset_categories = []
assets = []
allocations = []
transfer_requests = []
bookings = []
maintenance_requests = []
audit_cycles = []
audit_items = []
discrepancy_reports = []
notifications = []
activity_logs = []

# ----------------------------------------------------------------------------
# 1. Departments (10)
# ----------------------------------------------------------------------------
DEPT_NAMES = [
    "Engineering", "Sales", "Marketing", "Human Resources", "Finance",
    "Operations", "IT Support", "Customer Success", "Legal", "Facilities",
]

for i, name in enumerate(DEPT_NAMES, start=1):
    dept_id = new_id("dept", i)
    departments.append({
        "id": dept_id,
        "name": name,
        "headUserId": None,       # filled in after users are created
        "headUserName": None,
        "parentDepartmentId": None,
        "status": "active",
        "createdAt": iso(days_ago(720)),
        "updatedAt": iso(days_ago(30)),
    })

# Give two departments a parent relationship (simple 1-level hierarchy) to exercise
# the self-referencing hierarchy field: IT Support -> Operations, Customer Success -> Sales
dept_by_name = {d["name"]: d for d in departments}
dept_by_name["IT Support"]["parentDepartmentId"] = dept_by_name["Operations"]["id"]
dept_by_name["Customer Success"]["parentDepartmentId"] = dept_by_name["Sales"]["id"]

# ----------------------------------------------------------------------------
# 2. Users (50) — 1 admin, 4 asset_managers, 10 department_heads (1/dept), 35 employees
# ----------------------------------------------------------------------------
TOTAL_USERS = 50
N_ADMINS = 1
N_ASSET_MANAGERS = 4
N_DEPT_HEADS = len(departments)  # 10
N_EMPLOYEES = TOTAL_USERS - N_ADMINS - N_ASSET_MANAGERS - N_DEPT_HEADS  # 35

used_emails = set()


def make_email(name):
    base = name.lower().replace(" ", ".").replace("'", "")
    email = f"{base}@assetflow-demo.com"
    n = 1
    while email in used_emails:
        n += 1
        email = f"{base}{n}@assetflow-demo.com"
    used_emails.add(email)
    return email


user_counter = 0


def make_user(role, dept):
    global user_counter
    user_counter += 1
    uid = f"uid_{user_counter:04d}"
    name = fake.name()
    status = "active" if random.random() > 0.06 else "inactive"  # ~6% inactive employees
    created = days_ago(random.randint(30, 900))
    u = {
        "uid": uid,
        "name": name,
        "email": make_email(name),
        "phone": fake.phone_number() if random.random() > 0.15 else None,
        "departmentId": dept["id"] if dept else None,
        "departmentName": dept["name"] if dept else None,
        "role": role,
        "status": status,
        "createdAt": iso(created),
        "updatedAt": iso(created + timedelta(days=random.randint(0, 60))),
    }
    users.append(u)
    return u


# Admin(s) — not tied to a single department for simplicity (assigned to Operations)
for _ in range(N_ADMINS):
    make_user("admin", dept_by_name["Operations"])

# Asset managers — spread across departments (Operations / IT Support typically own this)
am_depts = [dept_by_name["Operations"], dept_by_name["IT Support"],
            dept_by_name["Facilities"], dept_by_name["Operations"]]
for d in am_depts[:N_ASSET_MANAGERS]:
    make_user("asset_manager", d)

# One department head per department
dept_heads_by_dept = {}
for d in departments:
    head = make_user("department_head", d)
    dept_heads_by_dept[d["id"]] = head
    d["headUserId"] = head["uid"]
    d["headUserName"] = head["name"]

# Remaining employees, spread roughly evenly across departments (some unassigned)
for i in range(N_EMPLOYEES):
    if i < N_EMPLOYEES - 3:
        d = departments[i % len(departments)]
    else:
        d = None  # a few employees with no department yet (newly onboarded)
    make_user("employee", d)

assert len(users) == TOTAL_USERS, len(users)

active_users = [u for u in users if u["status"] == "active"]
asset_managers = [u for u in users if u["role"] == "asset_manager"]
dept_heads = [u for u in users if u["role"] == "department_head"]
admins = [u for u in users if u["role"] == "admin"]
approvers = asset_managers + admins  # who typically approves maintenance/transfers

# ----------------------------------------------------------------------------
# 3. Asset Categories (12) — each with a small custom-field schema
# ----------------------------------------------------------------------------
CATEGORY_DEFS = [
    ("Laptops & Computers", [
        {"fieldKey": "warrantyMonths", "label": "Warranty (months)", "fieldType": "number", "required": True},
        {"fieldKey": "processor", "label": "Processor", "fieldType": "text", "required": False},
    ]),
    ("Monitors & Displays", [
        {"fieldKey": "screenSizeInches", "label": "Screen Size (in)", "fieldType": "number", "required": True},
    ]),
    ("Mobile Devices", [
        {"fieldKey": "imei", "label": "IMEI", "fieldType": "text", "required": True},
        {"fieldKey": "carrier", "label": "Carrier", "fieldType": "text", "required": False},
    ]),
    ("Furniture", [
        {"fieldKey": "material", "label": "Material", "fieldType": "text", "required": False},
    ]),
    ("Vehicles", [
        {"fieldKey": "plateNumber", "label": "Plate Number", "fieldType": "text", "required": True},
        {"fieldKey": "fuelType", "label": "Fuel Type", "fieldType": "text", "required": True},
    ]),
    ("Audio/Visual Equipment", [
        {"fieldKey": "resolution", "label": "Resolution", "fieldType": "text", "required": False},
    ]),
    ("Networking Equipment", [
        {"fieldKey": "portCount", "label": "Port Count", "fieldType": "number", "required": False},
    ]),
    ("Office Supplies Equipment", [
        {"fieldKey": "brand", "label": "Brand", "fieldType": "text", "required": False},
    ]),
    ("Power Tools", [
        {"fieldKey": "voltage", "label": "Voltage", "fieldType": "number", "required": False},
    ]),
    ("Meeting Room Resources", [
        {"fieldKey": "capacity", "label": "Capacity", "fieldType": "number", "required": True},
        {"fieldKey": "hasProjector", "label": "Has Projector", "fieldType": "boolean", "required": False},
    ]),
    ("Software Licenses (Dongles/Keys)", [
        {"fieldKey": "licenseExpiry", "label": "License Expiry", "fieldType": "date", "required": True},
    ]),
    ("Safety Equipment", [
        {"fieldKey": "lastInspectionDate", "label": "Last Inspection", "fieldType": "date", "required": False},
    ]),
]

for i, (name, custom_fields) in enumerate(CATEGORY_DEFS, start=1):
    asset_categories.append({
        "id": new_id("cat", i),
        "name": name,
        "customFields": custom_fields,
        "status": "active" if i != len(CATEGORY_DEFS) else "inactive",  # one inactive, for empty/legacy-state testing
        "createdAt": iso(days_ago(700)),
    })

cat_by_id = {c["id"]: c for c in asset_categories}

# ----------------------------------------------------------------------------
# 4. Assets (250)
# ----------------------------------------------------------------------------
ASSET_NAME_TEMPLATES = {
    "Laptops & Computers": ["Dell Latitude 5440", "Dell Latitude 7420", "MacBook Pro 14\"", "MacBook Air M2",
                            "Lenovo ThinkPad X1", "HP EliteBook 840", "HP Pavilion Desktop"],
    "Monitors & Displays": ["Dell UltraSharp 27\"", "LG 4K Monitor 32\"", "Samsung Curved Monitor 34\"",
                             "BenQ Designer Monitor 24\""],
    "Mobile Devices": ["iPhone 14", "iPhone 15 Pro", "Samsung Galaxy S23", "Google Pixel 8", "iPad Air"],
    "Furniture": ["Ergonomic Office Chair", "Standing Desk", "Filing Cabinet", "Conference Table", "Bookshelf Unit"],
    "Vehicles": ["Toyota Hiace Van", "Honda Civic", "Toyota Hilux Pickup", "Yamaha Delivery Scooter"],
    "Audio/Visual Equipment": ["Epson Projector EB-X500", "BenQ Projector MW632ST", "Sony Conference Camera",
                                "JBL PA Speaker System"],
    "Networking Equipment": ["Cisco Catalyst Switch 24-port", "Ubiquiti Access Point", "Netgear Router Nighthawk",
                              "TP-Link Managed Switch"],
    "Office Supplies Equipment": ["Canon ImageClass Printer", "Epson EcoTank Printer", "Fellowes Paper Shredder",
                                   "Brother Label Maker"],
    "Power Tools": ["DeWalt Cordless Drill", "Makita Angle Grinder", "Bosch Impact Driver"],
    "Meeting Room Resources": ["Conference Room A - Bay 1", "Conference Room B - Bay 2",
                                "Huddle Room - 3rd Floor", "Boardroom - Executive Suite"],
    "Software Licenses (Dongles/Keys)": ["AutoCAD License Dongle", "Adobe Creative Cloud Key",
                                          "MATLAB License Token"],
    "Safety Equipment": ["Fire Extinguisher (5kg)", "First Aid Kit - Large", "Safety Helmet Set",
                          "Emergency Eyewash Station"],
}

LOCATIONS = [
    "1st Floor, Bay 1", "1st Floor, Bay 2", "2nd Floor, Bay 1", "2nd Floor, Bay 2",
    "3rd Floor, Bay 1", "3rd Floor, Bay 2", "Ground Floor, Reception", "Basement Storage",
    "Warehouse A", "Warehouse B", "Remote — Field Office", "Executive Suite",
]

CONDITIONS = ["New", "Good", "Fair", "Poor", "Damaged"]
CONDITION_WEIGHTS = [0.15, 0.45, 0.25, 0.10, 0.05]

# Target status distribution across 250 assets (deliberately covers every lifecycle state
# so every screen/filter has data to show):
N_ASSETS = 250
status_plan = (
    ["Available"] * 95 +
    ["Allocated"] * 88 +
    ["Reserved"] * 8 +
    ["Under Maintenance"] * 20 +
    ["Lost"] * 7 +
    ["Retired"] * 22 +
    ["Disposed"] * 10
)
assert len(status_plan) == N_ASSETS
random.shuffle(status_plan)

BOOKABLE_CATEGORIES = {"Meeting Room Resources", "Vehicles", "Audio/Visual Equipment"}

asset_tag_counter = 0
for i in range(1, N_ASSETS + 1):
    asset_tag_counter += 1
    cat = random.choice(asset_categories[:-1])  # avoid the inactive legacy category for most
    if random.random() < 0.03:
        cat = asset_categories[-1]  # sprinkle a few assets in the inactive category (edge case)
    cat_name = cat["name"]
    name = random.choice(ASSET_NAME_TEMPLATES[cat_name])
    status = status_plan[i - 1]

    is_bookable = cat_name in BOOKABLE_CATEGORIES and random.random() < 0.7
    # Reserved status only makes sense for bookable assets — patch the plan if mismatched
    if status == "Reserved" and not is_bookable:
        is_bookable = True

    acquisition_date = days_ago(random.randint(20, 1100))
    condition = status if status == "Damaged" else random.choices(CONDITIONS, weights=CONDITION_WEIGHTS)[0]
    if status in ("Lost", "Disposed", "Retired") and condition == "New":
        condition = random.choice(["Fair", "Poor", "Good"])

    holder_type = None
    holder_id = None
    holder_name = None
    if status in ("Allocated",):
        if random.random() < 0.9:
            holder = random.choice(active_users)
            holder_type, holder_id, holder_name = "employee", holder["uid"], holder["name"]
        else:
            holder_dept = random.choice(departments)
            holder_type, holder_id, holder_name = "department", holder_dept["id"], holder_dept["name"]

    custom_field_values = {}
    for f in cat["customFields"]:
        if f["fieldType"] == "number":
            custom_field_values[f["fieldKey"]] = random.choice([6, 12, 24, 36]) if "warranty" in f["fieldKey"].lower() else random.randint(2, 64)
        elif f["fieldType"] == "boolean":
            custom_field_values[f["fieldKey"]] = random.choice([True, False])
        elif f["fieldType"] == "date":
            custom_field_values[f["fieldKey"]] = iso(days_from_now(random.randint(-200, 500)))
        else:
            if f["fieldKey"] == "plateNumber":
                custom_field_values[f["fieldKey"]] = f"KDA {random.randint(100,999)}{random.choice('ABCDEFGH')}"
            elif f["fieldKey"] == "imei":
                custom_field_values[f["fieldKey"]] = "".join(str(random.randint(0, 9)) for _ in range(15))
            elif f["fieldKey"] == "fuelType":
                custom_field_values[f["fieldKey"]] = random.choice(["Petrol", "Diesel", "Electric"])
            else:
                custom_field_values[f["fieldKey"]] = fake.word().capitalize()

    created = acquisition_date + timedelta(hours=random.randint(1, 48))
    asset = {
        "id": new_id("asset", i),
        "assetTag": f"AF-{asset_tag_counter:04d}",
        "name": name,
        "categoryId": cat["id"],
        "categoryName": cat_name,
        "serialNumber": f"SN-{random.randint(10000, 99999)}{random.choice('XYZ')}",
        "qrCode": f"AF-{asset_tag_counter:04d}",
        "acquisitionDate": iso(acquisition_date),
        "acquisitionCost": round(random.uniform(80, 45000), 2),
        "condition": condition,
        "location": random.choice(LOCATIONS),
        "photos": [],
        "documents": [],
        "isBookable": is_bookable,
        "status": status,
        "currentHolderType": holder_type,
        "currentHolderId": holder_id,
        "currentHolderName": holder_name,
        "customFieldValues": custom_field_values,
        "createdAt": iso(created),
        "updatedAt": iso(created + timedelta(days=random.randint(0, 400))),
    }
    assets.append(asset)

assets_by_status = {}
for a in assets:
    assets_by_status.setdefault(a["status"], []).append(a)

bookable_assets = [a for a in assets if a["isBookable"]]

# ----------------------------------------------------------------------------
# 5. Allocations (100)
# ----------------------------------------------------------------------------
allocation_counter = 0


def make_allocation(asset, holder_type, holder_id, holder_name, status, alloc_date, expected_return=None,
                     actual_return=None, notes=None):
    global allocation_counter
    allocation_counter += 1
    allocator = random.choice(asset_managers) if asset_managers else random.choice(active_users)
    a = {
        "id": new_id("alloc", allocation_counter),
        "assetId": asset["id"],
        "assetTag": asset["assetTag"],
        "allocatedToType": holder_type,
        "allocatedToId": holder_id,
        "allocatedToName": holder_name,
        "allocatedByUserId": allocator["uid"],
        "allocationDate": iso(alloc_date),
        "expectedReturnDate": iso(expected_return),
        "actualReturnDate": iso(actual_return),
        "status": status,
        "returnConditionNotes": notes,
        "createdAt": iso(alloc_date),
        "updatedAt": iso(actual_return or alloc_date),
    }
    allocations.append(a)
    return a


# 5a. One active/overdue allocation per currently-Allocated asset (keeps assets.currentHolder consistent)
for asset in assets_by_status.get("Allocated", []):
    alloc_date = days_ago(random.randint(5, 300))
    is_overdue = random.random() < 0.18
    if is_overdue:
        expected_return = days_ago(random.randint(1, 20))  # in the past -> overdue
        status = "overdue"
    else:
        expected_return = days_from_now(random.randint(5, 90)) if random.random() < 0.7 else None
        status = "active"
    make_allocation(
        asset, asset["currentHolderType"], asset["currentHolderId"], asset["currentHolderName"],
        status, alloc_date, expected_return
    )

# 5b. Historical "returned" allocations to reach 100 total (spread across any asset, incl. Available/Retired ones)
while len(allocations) < 100:
    asset = random.choice(assets)
    if random.random() < 0.9:
        holder = random.choice(active_users)
        holder_type, holder_id, holder_name = "employee", holder["uid"], holder["name"]
    else:
        d = random.choice(departments)
        holder_type, holder_id, holder_name = "department", d["id"], d["name"]
    alloc_date = days_ago(random.randint(60, 1000))
    expected_return = alloc_date + timedelta(days=random.randint(14, 120))
    actual_return = expected_return - timedelta(days=random.randint(-5, 10))
    make_allocation(
        asset, holder_type, holder_id, holder_name, "returned", alloc_date,
        expected_return, actual_return,
        notes=random.choice(["Returned in good condition.", "Minor wear noted.", "Screen scratch noted on return.",
                              None, None]),
    )

active_or_overdue_allocations = [a for a in allocations if a["status"] in ("active", "overdue")]

# ----------------------------------------------------------------------------
# 6. Transfer Requests (30)
# ----------------------------------------------------------------------------
TR_STATUSES = ["requested", "approved", "rejected", "completed"]
TR_WEIGHTS = [0.30, 0.15, 0.15, 0.40]

candidate_allocs_for_transfer = random.sample(
    active_or_overdue_allocations, k=min(30, len(active_or_overdue_allocations))
)
# pad if not enough active allocations
extra_needed = 30 - len(candidate_allocs_for_transfer)
if extra_needed > 0:
    candidate_allocs_for_transfer += random.choices(active_or_overdue_allocations, k=extra_needed)

for i, alloc in enumerate(candidate_allocs_for_transfer, start=1):
    asset = next(a for a in assets if a["id"] == alloc["assetId"])
    to_user = random.choice(active_users)
    requester = random.choice(active_users)
    status = random.choices(TR_STATUSES, weights=TR_WEIGHTS)[0]
    request_date = days_ago(random.randint(1, 200))
    decision_date = None
    approver = None
    if status in ("approved", "rejected", "completed"):
        decision_date = request_date + timedelta(days=random.randint(1, 10))
        approver = random.choice(dept_heads + asset_managers)
    transfer_requests.append({
        "id": new_id("tr", i),
        "assetId": asset["id"],
        "assetTag": asset["assetTag"],
        "currentAllocationId": alloc["id"],
        "fromHolderId": alloc["allocatedToId"],
        "toHolderId": to_user["uid"],
        "requestedByUserId": requester["uid"],
        "status": status,
        "approvedByUserId": approver["uid"] if approver else None,
        "requestDate": iso(request_date),
        "decisionDate": iso(decision_date),
    })

# ----------------------------------------------------------------------------
# 7. Bookings (40) — only on bookable assets, non-overlapping per asset
# ----------------------------------------------------------------------------
BOOKING_STATUSES_PAST = ["Completed", "Cancelled"]
booking_counter = 0
# track next-free slot per asset to avoid overlaps
next_slot = {a["id"]: days_ago(random.randint(10, 30)) for a in bookable_assets}

for i in range(1, 41):
    asset = random.choice(bookable_assets)
    start = next_slot[asset["id"]] + timedelta(hours=random.randint(2, 72))
    duration_hours = random.choice([1, 1, 2, 3, 4])
    end = start + timedelta(hours=duration_hours)
    next_slot[asset["id"]] = end

    if end < NOW:
        status = random.choices(BOOKING_STATUSES_PAST, weights=[0.85, 0.15])[0]
    elif start <= NOW <= end:
        status = "Ongoing"
    else:
        status = "Upcoming"

    booker = random.choice(active_users)
    on_behalf_of_dept = booker["departmentId"] if random.random() < 0.25 else None

    bookings.append({
        "id": new_id("booking", i),
        "resourceAssetId": asset["id"],
        "assetTag": asset["assetTag"],
        "bookedByUserId": booker["uid"],
        "departmentId": on_behalf_of_dept,
        "startTime": iso(start),
        "endTime": iso(end),
        "status": status,
        "createdAt": iso(start - timedelta(days=random.randint(1, 7))),
    })

# ----------------------------------------------------------------------------
# 8. Maintenance Requests (35)
# ----------------------------------------------------------------------------
MR_ISSUES = [
    "Battery not holding charge", "Screen flickering intermittently", "Won't power on",
    "Unusual noise during operation", "Keyboard keys unresponsive", "Overheating under load",
    "Physical damage to casing", "Software crashes repeatedly", "Charging port loose",
    "Fluid leak detected", "Brakes need inspection (vehicle)", "AC unit not cooling",
    "Projector bulb dim/flickering", "Network port not linking",
]
MR_PRIORITIES = ["Low", "Medium", "High", "Critical"]
MR_PRIORITY_WEIGHTS = [0.30, 0.35, 0.25, 0.10]
MR_STATUSES = ["Pending", "Approved", "Rejected", "Technician Assigned", "In Progress", "Resolved"]
MR_STATUS_WEIGHTS = [0.12, 0.10, 0.08, 0.10, 0.15, 0.45]
TECHNICIANS = ["Internal - IT Support", "Internal - Facilities", "Vendor: FixIt Solutions",
               "Vendor: TechCare Ltd.", "Vendor: AutoServ Garage", None]

under_maintenance_assets = assets_by_status.get("Under Maintenance", [])
other_assets_pool = [a for a in assets if a["status"] != "Under Maintenance"]

mr_count = 35
mr_assets = list(under_maintenance_assets)  # ensure every "Under Maintenance" asset has an open request
while len(mr_assets) < mr_count:
    mr_assets.append(random.choice(other_assets_pool))
mr_assets = mr_assets[:mr_count]

for i, asset in enumerate(mr_assets, start=1):
    raiser = random.choice(active_users)
    created = days_ago(random.randint(1, 300))
    if asset["status"] == "Under Maintenance":
        status = random.choice(["Approved", "Technician Assigned", "In Progress"])
    else:
        status = random.choices(MR_STATUSES, weights=MR_STATUS_WEIGHTS)[0]

    approver = None
    resolved_at = None
    resolution_notes = None
    technician = None
    if status != "Pending":
        approver = random.choice(asset_managers)
    if status in ("Technician Assigned", "In Progress", "Resolved"):
        technician = random.choice(TECHNICIANS[:-1])
    if status == "Resolved":
        resolved_at = created + timedelta(days=random.randint(1, 21))
        resolution_notes = random.choice([
            "Replaced faulty part, tested working.", "Repaired under warranty.",
            "Cleaned and recalibrated.", "Software reinstalled, issue resolved.",
        ])

    maintenance_requests.append({
        "id": new_id("mr", i),
        "assetId": asset["id"],
        "assetTag": asset["assetTag"],
        "raisedByUserId": raiser["uid"],
        "issueDescription": random.choice(MR_ISSUES),
        "priority": random.choices(MR_PRIORITIES, weights=MR_PRIORITY_WEIGHTS)[0],
        "photos": [],
        "status": status,
        "approvedByUserId": approver["uid"] if approver else None,
        "technicianId": technician,
        "resolutionNotes": resolution_notes,
        "createdAt": iso(created),
        "resolvedAt": iso(resolved_at),
    })

# ----------------------------------------------------------------------------
# 9. Audit Cycles (4) + Audit Items (250) + Discrepancy Reports
# ----------------------------------------------------------------------------
AUDIT_CYCLE_DEFS = [
    ("Q1 2026 Engineering Audit", "department", "Engineering", 210, 195, "Closed"),
    ("Q2 2026 Warehouse Spot-Check", "location", "Warehouse A", 120, 105, "Closed"),
    ("Q3 2026 Facilities Audit", "department", "Facilities", 40, 25, "Open"),
    ("Annual HQ-Wide Audit 2026", "location", "1st Floor, Bay 1", 10, -5, "Open"),  # ends in the future
]

audit_item_counter = 0
RESULT_WEIGHTS_CLOSED = {"Verified": 0.82, "Missing": 0.08, "Damaged": 0.10, "Pending": 0.0}
RESULT_WEIGHTS_OPEN = {"Verified": 0.35, "Missing": 0.03, "Damaged": 0.05, "Pending": 0.57}

items_per_cycle = [90, 70, 50, 40]  # sums to 250

for ci, (name, scope_type, scope_value, start_days_ago, end_days_ago, status) in enumerate(AUDIT_CYCLE_DEFS, start=1):
    cycle_id = new_id("audit", ci)
    date_start = days_ago(start_days_ago)
    date_end = days_ago(end_days_ago) if end_days_ago >= 0 else days_from_now(-end_days_ago)
    auditors = random.sample(asset_managers + dept_heads, k=min(2, len(asset_managers + dept_heads)))
    creator = random.choice(admins + asset_managers)
    closed_at = date_end + timedelta(days=random.randint(1, 5)) if status == "Closed" else None

    audit_cycles.append({
        "id": cycle_id,
        "name": name,
        "scopeType": scope_type,
        "scopeValue": scope_value,
        "dateRangeStart": iso(date_start),
        "dateRangeEnd": iso(date_end),
        "auditorIds": [a["uid"] for a in auditors],
        "status": status,
        "createdByUserId": creator["uid"],
        "createdAt": iso(date_start - timedelta(days=3)),
        "closedAt": iso(closed_at),
    })

    n_items = items_per_cycle[ci - 1]
    in_scope_assets = random.sample(assets, k=min(n_items, len(assets)))
    weights = RESULT_WEIGHTS_CLOSED if status == "Closed" else RESULT_WEIGHTS_OPEN
    cycle_flagged = []

    for asset in in_scope_assets:
        audit_item_counter += 1
        result = random.choices(list(weights.keys()), weights=list(weights.values()))[0]
        auditor = random.choice(auditors) if auditors else random.choice(asset_managers)
        verified_at = None
        notes = None
        if result != "Pending":
            verified_at = date_start + timedelta(days=random.randint(0, max(1, start_days_ago - end_days_ago)))
            if result == "Missing":
                notes = "Not found at last known location during audit."
            elif result == "Damaged":
                notes = "Visible damage noted during physical inspection."
            else:
                notes = "Confirmed present and matches records." if random.random() < 0.4 else None

        item = {
            "id": new_id("auditItem", audit_item_counter),
            "auditCycleId": cycle_id,
            "assetId": asset["id"],
            "assetTag": asset["assetTag"],
            "auditorId": auditor["uid"],
            "result": result,
            "notes": notes,
            "verifiedAt": iso(verified_at),
        }
        audit_items.append(item)
        if result in ("Missing", "Damaged"):
            cycle_flagged.append({
                "assetId": asset["id"], "assetTag": asset["assetTag"],
                "result": result, "notes": notes,
            })

    if status == "Closed" and cycle_flagged:
        discrepancy_reports.append({
            "id": new_id("disc", len(discrepancy_reports) + 1),
            "auditCycleId": cycle_id,
            "flaggedItems": cycle_flagged,
            "generatedAt": iso(closed_at),
            "resolutionStatus": random.choice(["open", "reviewed"]),
        })

# ----------------------------------------------------------------------------
# 10. Notifications (300)
# ----------------------------------------------------------------------------
NOTIF_TYPES = ["AssetAssigned", "MaintenanceApproved", "MaintenanceRejected", "BookingConfirmed",
               "BookingCancelled", "BookingReminder", "TransferApproved", "OverdueReturn",
               "AuditDiscrepancyFlagged"]

NOTIF_MESSAGES = {
    "AssetAssigned": "A new asset has been allocated to you: {tag}.",
    "MaintenanceApproved": "Your maintenance request for {tag} has been approved.",
    "MaintenanceRejected": "Your maintenance request for {tag} was rejected.",
    "BookingConfirmed": "Your booking for {tag} has been confirmed.",
    "BookingCancelled": "Your booking for {tag} has been cancelled.",
    "BookingReminder": "Reminder: your booking for {tag} starts soon.",
    "TransferApproved": "Your transfer request for {tag} has been approved.",
    "OverdueReturn": "Return for {tag} is overdue. Please return it as soon as possible.",
    "AuditDiscrepancyFlagged": "Asset {tag} was flagged during an audit cycle.",
}
NOTIF_ENTITY_TYPE = {
    "AssetAssigned": "allocation", "MaintenanceApproved": "maintenanceRequest",
    "MaintenanceRejected": "maintenanceRequest", "BookingConfirmed": "booking",
    "BookingCancelled": "booking", "BookingReminder": "booking",
    "TransferApproved": "transferRequest", "OverdueReturn": "allocation",
    "AuditDiscrepancyFlagged": "auditItem",
}

for i in range(1, 301):
    ntype = random.choice(NOTIF_TYPES)
    asset = random.choice(assets)
    recipient = random.choice(users)
    created = days_ago(random.randint(0, 250))
    notifications.append({
        "id": new_id("notif", i),
        "userId": recipient["uid"],
        "type": ntype,
        "message": NOTIF_MESSAGES[ntype].format(tag=asset["assetTag"]),
        "relatedEntityType": NOTIF_ENTITY_TYPE[ntype],
        "relatedEntityId": new_id(NOTIF_ENTITY_TYPE[ntype][:5], random.randint(1, 90)),
        "isRead": random.random() < 0.62,
        "createdAt": iso(created),
    })

# ----------------------------------------------------------------------------
# 11. Activity Logs (600) — append-only audit trail
# ----------------------------------------------------------------------------
ACTIONS = [
    ("asset.registered", "asset"), ("asset.updated", "asset"), ("asset.retired", "asset"),
    ("asset.allocated", "allocation"), ("asset.returned", "allocation"),
    ("transfer.requested", "transferRequest"), ("transfer.approved", "transferRequest"),
    ("transfer.rejected", "transferRequest"), ("booking.created", "booking"),
    ("booking.cancelled", "booking"), ("maintenance.raised", "maintenanceRequest"),
    ("maintenance.approved", "maintenanceRequest"), ("maintenance.resolved", "maintenanceRequest"),
    ("audit.cycle.created", "auditCycle"), ("audit.cycle.closed", "auditCycle"),
    ("audit.item.verified", "auditItem"), ("user.role.changed", "user"),
    ("department.created", "department"), ("category.created", "assetCategory"),
]

for i in range(1, 601):
    action, entity_type = random.choice(ACTIONS)
    actor = random.choice(users)
    ts = days_ago(random.randint(0, 730))
    entity_id = new_id(entity_type[:5], random.randint(1, 200))
    details = {"note": fake.sentence(nb_words=6)}
    activity_logs.append({
        "id": new_id("log", i),
        "userId": actor["uid"],
        "action": action,
        "entityType": entity_type,
        "entityId": entity_id,
        "details": details,
        "timestamp": iso(ts),
    })

# ----------------------------------------------------------------------------
# Write everything out
# ----------------------------------------------------------------------------
COLLECTIONS = {
    "departments": departments,
    "users": users,
    "assetCategories": asset_categories,
    "assets": assets,
    "allocations": allocations,
    "transferRequests": transfer_requests,
    "bookings": bookings,
    "maintenanceRequests": maintenance_requests,
    "auditCycles": audit_cycles,
    "auditItems": audit_items,
    "discrepancyReports": discrepancy_reports,
    "notifications": notifications,
    "activityLogs": activity_logs,
}


def flatten_for_csv(record):
    """Flatten nested dicts/lists into JSON strings so CSV stays one-row-per-doc."""
    flat = {}
    for k, v in record.items():
        if isinstance(v, (dict, list)):
            flat[k] = json.dumps(v, ensure_ascii=False)
        else:
            flat[k] = v
    return flat


for name, records in COLLECTIONS.items():
    # JSON (nested, ready for Firestore import)
    json_path = os.path.join(JSON_DIR, f"{name}.json")
    with open(json_path, "w") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    # CSV (flattened, ready for Excel/Sheets)
    csv_path = os.path.join(CSV_DIR, f"{name}.csv")
    if records:
        flat_records = [flatten_for_csv(r) for r in records]
        fieldnames = list(flat_records[0].keys())
        with open(csv_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(flat_records)
    else:
        with open(csv_path, "w") as f:
            f.write("")

# ----------------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------------
print("Seed data generated (seed =", SEED, "):")
for name, records in COLLECTIONS.items():
    print(f"  {name:20s} {len(records):4d} documents")
print("\nStatus distribution (assets):")
for status, group in sorted(assets_by_status.items(), key=lambda kv: -len(kv[1])):
    print(f"  {status:20s} {len(group)}")
print("\nAllocation status distribution:")
from collections import Counter
print(" ", dict(Counter(a["status"] for a in allocations)))
print("\nDone.")
