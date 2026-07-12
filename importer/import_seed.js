/**
 * AssetFlow — Seed Data Importer
 * Imports departments_seed.csv and asset_categories_seed.csv
 * into Firestore using firebase-admin.
 *
 * Run: node import_seed.js
 *
 * Place serviceAccountKey.json in THIS folder before running.
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseCsv } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load service account ─────────────────────────────────
const keyPath = resolve(__dirname, 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch {
  console.error('\n❌ serviceAccountKey.json not found!');
  console.error('   Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key');
  console.error(`   Save it as: ${keyPath}\n`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const TS = admin.firestore.FieldValue.serverTimestamp;

// ── Helper: batch-write an array of {docId, data} objects ─
async function batchWrite(collectionName, docs) {
  const colRef  = db.collection(collectionName);
  const CHUNK   = 490;
  let written   = 0;

  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = db.batch();
    for (const { docId, data } of docs.slice(i, i + CHUNK)) {
      const ref = docId ? colRef.doc(docId) : colRef.doc();
      batch.set(ref, { ...data, createdAt: TS(), updatedAt: TS() }, { merge: true });
    }
    await batch.commit();
    written += Math.min(CHUNK, docs.length - i);
    console.log(`  ↑ ${written}/${docs.length} written`);
  }
}

// ── 1. Import Departments ────────────────────────────────
async function importDepartments() {
  const raw  = readFileSync(resolve(__dirname, '../data/departments_seed.csv'), 'utf8');
  const rows = parseCsv(raw, { columns: true, skip_empty_lines: true, trim: true });

  const docs = rows.map(r => ({
    docId: r.docId || null,
    data:  {
      name:               r.name,
      status:             r.status || 'active',
      headUserId:         r.headUserId   || null,
      headUserName:       r.headUserName || null,
      parentDepartmentId: r.parentDepartmentId || null,
    },
  }));

  console.log(`\n📁 Importing ${docs.length} departments...`);
  await batchWrite('departments', docs);
  console.log(`✅ Departments done.\n`);
}

// ── 2. Import Asset Categories ───────────────────────────
async function importCategories() {
  const raw  = readFileSync(resolve(__dirname, '../data/asset_categories_seed.csv'), 'utf8');
  const rows = parseCsv(raw, { columns: true, skip_empty_lines: true, trim: true });

  const docs = rows.map(r => {
    // Parse the JSON string in customFields_json column → array
    let customFields = [];
    if (r.customFields_json) {
      try { customFields = JSON.parse(r.customFields_json); }
      catch { console.warn(`  ⚠ Could not parse customFields for: ${r.name}`); }
    }
    return {
      docId: r.docId || null,
      data:  {
        name:         r.name,
        status:       r.status || 'active',
        customFields,
      },
    };
  });

  console.log(`📦 Importing ${docs.length} asset categories...`);
  await batchWrite('assetCategories', docs);
  console.log(`✅ Asset categories done.\n`);
}

// ── 3. Ensure counters/assetTag exists ───────────────────
async function ensureCounter() {
  const ref = db.collection('counters').doc('assetTag');
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ seq: 0 });
    console.log('✅ Counter (assetTag) initialized.\n');
  } else {
    console.log(`✅ Counter already exists (seq=${snap.data().seq}).\n`);
  }
}

// ── Run ──────────────────────────────────────────────────
console.log('\n🔥 AssetFlow Seed Importer\n');
try {
  await ensureCounter();
  await importDepartments();
  await importCategories();
  console.log('🎉 All seed data imported successfully!\n');
} catch (err) {
  console.error('❌ Import failed:', err.message);
  process.exit(1);
}
process.exit(0);
