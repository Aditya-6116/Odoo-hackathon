// AssetFlow Firestore Seed Script (CommonJS, no auth needed — uses temp open rules)
// Run: node seed.cjs

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey:            "AIzaSyBkR3uU4hpy8jUomk0qM-nM3p9X3QDPOXk",
  authDomain:        "odoo-hackathon-5b416.firebaseapp.com",
  projectId:         "odoo-hackathon-5b416",
  storageBucket:     "odoo-hackathon-5b416.firebasestorage.app",
  messagingSenderId: "766476925231",
  appId:             "1:766476925231:web:ebe52013ca51e50a9f89da",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const DEPARTMENTS = [
  'Engineering','Human Resources','Finance','IT','Operations','Marketing','Administration'
];

const CATEGORIES = [
  'Laptop','Monitor','Mobile Phone','Furniture','Projector',
  'Meeting Room','Network Equipment','Server','Vehicle','Other'
];

async function main() {
  console.log('\n🔥 Seeding Firestore...\n');

  // Counter
  await setDoc(doc(db, 'counters', 'assetTag'), { seq: 0 });
  console.log('✓ Counter (assetTag) initialized');

  // Departments
  for (const name of DEPARTMENTS) {
    await addDoc(collection(db, 'departments'), {
      name, status: 'active',
      headUserId: null, headUserName: null, parentDepartmentId: null,
    });
  }
  console.log(`✓ ${DEPARTMENTS.length} departments seeded`);

  // Asset Categories
  for (const name of CATEGORIES) {
    await addDoc(collection(db, 'assetCategories'), {
      name, status: 'active', customFields: [],
    });
  }
  console.log(`✓ ${CATEGORIES.length} asset categories seeded`);

  console.log('\n✅ Done! Firestore is ready.\n');
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
