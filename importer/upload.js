/**
 * ─────────────────────────────────────────────────────────
 *  AssetFlow — Firestore Bulk Importer
 *  Uses firebase-admin + batch writes (max 500/batch)
 * ─────────────────────────────────────────────────────────
 *  Usage:
 *    node upload.js --collection <name> --file <path.csv|path.json>
 *
 *  Examples:
 *    node upload.js --collection assets       --file assets.csv
 *    node upload.js --collection departments  --file departments.json
 *    node upload.js --collection users        --file users.csv --id-field email
 *
 *  Flags:
 *    --collection   (required) Firestore collection name
 *    --file         (required) Path to CSV or JSON file
 *    --id-field     (optional) Use this column as the Firestore document ID
 *                              instead of an auto-generated ID
 *    --dry-run      (optional) Parse & preview only — no writes to Firestore
 * ─────────────────────────────────────────────────────────
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, extname } from 'path';
import { parse as parseCsv } from 'csv-parse/sync';
import { createRequire } from 'module';
import { parseArgs } from 'util';

// ── 1. Parse CLI args ────────────────────────────────────
const { values: args } = parseArgs({
  options: {
    collection: { type: 'string' },
    file:       { type: 'string' },
    'id-field': { type: 'string' },
    'dry-run':  { type: 'boolean', default: false },
  },
  strict: true,
});

if (!args.collection || !args.file) {
  console.error('\n❌ Missing required flags. Usage:\n');
  console.error('  node upload.js --collection <name> --file <path>\n');
  process.exit(1);
}

// ── 2. Load service account key ──────────────────────────
const keyPath = resolve('./serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch {
  console.error(`\n❌ Could not read serviceAccountKey.json at: ${keyPath}`);
  console.error('   Download it from Firebase Console → Project Settings → Service accounts\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// ── 3. Load & parse data file ────────────────────────────
const filePath = resolve(args.file);
const ext      = extname(filePath).toLowerCase();
let records    = [];

try {
  const raw = readFileSync(filePath, 'utf8');

  if (ext === '.json') {
    const parsed = JSON.parse(raw);
    records = Array.isArray(parsed) ? parsed : [parsed];
  } else if (ext === '.csv') {
    records = parseCsv(raw, {
      columns:          true,   // first row = headers
      skip_empty_lines: true,
      trim:             true,
      cast:             true,   // auto-cast numbers/booleans
    });
  } else {
    console.error(`\n❌ Unsupported file type: ${ext}. Use .csv or .json\n`);
    process.exit(1);
  }
} catch (err) {
  console.error(`\n❌ Failed to read file: ${err.message}\n`);
  process.exit(1);
}

if (records.length === 0) {
  console.error('\n❌ File is empty or has no data rows.\n');
  process.exit(1);
}

console.log(`\n🔥 Firestore Bulk Importer`);
console.log(`   Collection : ${args.collection}`);
console.log(`   File       : ${args.file}`);
console.log(`   Records    : ${records.length}`);
console.log(`   ID field   : ${args['id-field'] ?? '(auto-generated)'}`);
console.log(`   Dry run    : ${args['dry-run'] ? 'YES — no writes' : 'no'}\n`);

// ── 4. Preview first 3 rows ──────────────────────────────
console.log('📋 Sample rows:');
records.slice(0, 3).forEach((r, i) => console.log(`  [${i}]`, JSON.stringify(r)));
console.log('');

if (args['dry-run']) {
  console.log('✅ Dry run complete. Remove --dry-run to write to Firestore.\n');
  process.exit(0);
}

// ── 5. Chunked batch upload (500 writes/batch max) ───────
const BATCH_SIZE = 490; // stay safely under the 500 limit

async function uploadInBatches(records) {
  const collectionRef = db.collection(args.collection);
  let totalWritten = 0;
  let batchNumber  = 1;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const record of chunk) {
      // Build document reference
      const idField = args['id-field'];
      const docRef  = idField && record[idField]
        ? collectionRef.doc(String(record[idField]))
        : collectionRef.doc(); // auto-ID

      // Clean up: remove the id-field from the stored data (already used as doc ID)
      const data = { ...record };
      if (idField) delete data[idField];

      // Add Firestore server timestamp
      data._importedAt = admin.firestore.FieldValue.serverTimestamp();

      batch.set(docRef, data, { merge: true });
    }

    await batch.commit();
    totalWritten += chunk.length;
    console.log(`  ✓ Batch ${batchNumber} committed — ${totalWritten}/${records.length} records`);
    batchNumber++;
  }

  return totalWritten;
}

// ── 6. Run ───────────────────────────────────────────────
try {
  const total = await uploadInBatches(records);
  console.log(`\n✅ Done! ${total} records written to '${args.collection}' collection.\n`);
} catch (err) {
  console.error(`\n❌ Upload failed: ${err.message}\n`);
  process.exit(1);
}
