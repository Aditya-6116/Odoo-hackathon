import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const seedDataRoot = path.resolve(projectRoot, '..', 'test data', 'seed_data', 'json');

const collectionsInOrder = [
  'departments',
  'users',
  'assetCategories',
  'assets',
  'allocations',
  'transferRequests',
  'bookings',
  'maintenanceRequests',
  'auditCycles',
  'auditItems',
  'discrepancyReports',
  'notifications',
  'activityLogs',
];

const argv = process.argv.slice(2);
const hasFlag = (flag) => argv.includes(flag);
const valueAfter = (flag) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
};
const valuesAfter = (flag) => {
  const index = argv.indexOf(flag);
  if (index < 0) {
    return [];
  }

  const values = [];
  for (let i = index + 1; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      break;
    }
    values.push(argv[i]);
  }
  return values;
};

const useEmulator = hasFlag('--emulator') || Boolean(process.env.FIRESTORE_EMULATOR_HOST) || Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
const wipe = hasFlag('--wipe');
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'assetflow-demo';
const authPassword = process.env.SEED_AUTH_PASSWORD || 'Test1234!';
const onlyCollections = valuesAfter('--only');
const serviceAccountPath = valueAfter('--service-account') || process.env.GOOGLE_APPLICATION_CREDENTIALS;

function toFirebaseValue(value) {
  if (Array.isArray(value)) {
    return value.map(toFirebaseValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, toFirebaseValue(nested)]));
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) {
    return Timestamp.fromDate(new Date(value));
  }

  return value;
}

async function readJson(collectionName) {
  const filePath = path.join(seedDataRoot, `${collectionName}.json`);
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function seedAuthUsers(auth, users) {
  for (const user of users) {
    try {
      await auth.updateUser(user.uid, {
        email: user.email,
        displayName: user.name,
        password: authPassword,
        disabled: false,
      });
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }

      await auth.createUser({
        uid: user.uid,
        email: user.email,
        displayName: user.name,
        password: authPassword,
        disabled: false,
      });
    }
  }
}

async function wipeCollection(firestore, collectionName) {
  const snapshot = await firestore.collection(collectionName).get();
  if (snapshot.empty) {
    return 0;
  }

  await Promise.all(snapshot.docs.map((document) => document.ref.delete()));
  return snapshot.size;
}

async function main() {
  if (!useEmulator && !serviceAccountPath) {
    throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS or pass --service-account when importing to a real Firebase project.');
  }

  const appConfig = useEmulator
    ? { projectId }
    : {
        credential: serviceAccountPath
          ? cert(JSON.parse(await fs.readFile(serviceAccountPath, 'utf8')))
          : applicationDefault(),
        projectId,
      };

  initializeApp(appConfig);

  const firestore = getFirestore();
  const auth = getAuth();
  const targets = onlyCollections.length > 0 ? onlyCollections : collectionsInOrder;

  for (const collectionName of targets) {
    const records = await readJson(collectionName);

    if (wipe) {
      const removedCount = await wipeCollection(firestore, collectionName);
      console.log(`[wiped] ${collectionName}: removed ${removedCount} docs`);
    }

    let batch = firestore.batch();
    let writes = 0;

    for (const record of records) {
      const docId = record.uid || record.id;
      const data = toFirebaseValue(record);
      batch.set(firestore.collection(collectionName).doc(docId), data, { merge: true });
      writes += 1;

      if (writes % 400 === 0) {
        await batch.commit();
        batch = firestore.batch();
      }
    }

    if (writes % 400 !== 0) {
      await batch.commit();
    }

    console.log(`[ok] ${collectionName}: imported ${writes} docs`);

    if (collectionName === 'users') {
      await seedAuthUsers(auth, records);
      console.log(`[ok] auth: seeded ${records.length} users`);
    }
  }

  console.log('\nImport complete.');
  console.log(`Test password: ${authPassword}`);
  console.log('Suggested login: allison.hill@assetflow-demo.com');
  if (useEmulator) {
    console.log('Target: Firebase emulators');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});