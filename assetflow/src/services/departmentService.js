import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { logActivity } from './activityLogService';

/** List all departments */
export async function getDepartments({ status } = {}) {
  const constraints = [orderBy('name')];
  if (status) constraints.unshift(where('status', '==', status));
  const snap = await getDocs(query(collection(db, 'departments'), ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Create a department */
export async function createDepartment(data, actorUid) {
  const ref = await addDoc(collection(db, 'departments'), {
    ...data,
    status:     data.status ?? 'active',
    createdAt:  serverTimestamp(),
    updatedAt:  serverTimestamp(),
  });
  await logActivity({
    userId: actorUid, action: 'department.created',
    entityType: 'department', entityId: ref.id,
    details: { name: data.name },
  });
  return ref.id;
}

/** Update a department */
export async function updateDepartment(id, data, actorUid) {
  await updateDoc(doc(db, 'departments', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  await logActivity({
    userId: actorUid, action: 'department.updated',
    entityType: 'department', entityId: id,
    details: data,
  });
}
