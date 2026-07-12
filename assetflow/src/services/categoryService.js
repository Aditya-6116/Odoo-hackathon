import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { logActivity } from './activityLogService';

/** List all asset categories */
export async function getCategories({ status } = {}) {
  const constraints = [orderBy('name')];
  if (status) constraints.unshift(where('status', '==', status));
  const snap = await getDocs(query(collection(db, 'assetCategories'), ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Create a category */
export async function createCategory(data, actorUid) {
  const ref = await addDoc(collection(db, 'assetCategories'), {
    name:         data.name,
    customFields: data.customFields ?? [],
    status:       data.status ?? 'active',
    createdAt:    serverTimestamp(),
  });
  await logActivity({
    userId: actorUid, action: 'category.created',
    entityType: 'assetCategory', entityId: ref.id,
    details: { name: data.name },
  });
  return ref.id;
}

/** Update a category */
export async function updateCategory(id, data, actorUid) {
  await updateDoc(doc(db, 'assetCategories', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  await logActivity({
    userId: actorUid, action: 'category.updated',
    entityType: 'assetCategory', entityId: id,
    details: data,
  });
}
