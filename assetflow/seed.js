/**
 * AssetFlow Firebase Seed Script
 * Run with: node seed.js
 * 
 * Seeds: 1 admin user record, default departments, asset categories
 * NOTE: Run this ONCE after first signup to initialize the database.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Departments ──────────────────────────────────────────────────
const DEPARTMENTS = [
  { name: 'Engineering',      status: 'active' },
  { name: 'Human Resources',  status: 'active' },
  { name: 'Finance',          status: 'active' },
  { name: 'Operations',       status: 'active' },
  { name: 'Marketing',        status: 'active' },
  { name: 'IT',               status: 'active' },
];

// ── Asset Categories ─────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Laptop',            status: 'active', customFields: [] },
  { name: 'Monitor',           status: 'active', customFields: [] },
  { name: 'Mobile Phone',      status: 'active', customFields: [] },
  { name: 'Furniture',         status: 'active', customFields: [] },
  { name: 'Vehicle',           status: 'active', customFields: [] },
  { name: 'Meeting Room',      status: 'active', customFields: [] },
  { name: 'Projector',         status: 'active', customFields: [] },
  { name: 'Network Equipment', status: 'active', customFields: [] },
  { name: 'Server',            status: 'active', customFields: [] },
  { name: 'Other',             status: 'active', customFields: [] },
];

// ── Counter (auto-tag counter) ────────────────────────────────────
async function seedCounter() {
  await setDoc(doc(db, 'counters', 'assetTag'), { seq: 0 });
  console.log('✓ Counter initialized');
}

async function seedDepartments() {
  for (const dept of DEPARTMENTS) {
    await addDoc(collection(db, 'departments'), {
      ...dept,
      headUserId:   null,
      headUserName: null,
      parentDepartmentId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  console.log(`✓ ${DEPARTMENTS.length} departments seeded`);
}

async function seedCategories() {
  for (const cat of CATEGORIES) {
    await addDoc(collection(db, 'assetCategories'), {
      ...cat,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  console.log(`✓ ${CATEGORIES.length} categories seeded`);
}

async function main() {
  console.log('\n🔥 AssetFlow Seed Script\n');
  try {
    await seedCounter();
    await seedDepartments();
    await seedCategories();
    console.log('\n✅ Seed complete! Open the app, sign up, then promote yourself to admin in Firestore console.\n');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  }
  process.exit(0);
}

main();
