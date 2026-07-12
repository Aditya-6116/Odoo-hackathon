import {
  doc, getDoc, setDoc, updateDoc, getDocs,
  collection, query, where, orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

/** Fetch a single user profile */
export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** List all users, optionally filtered by status */
export async function getUsers({ status } = {}) {
  let q = collection(db, 'users');
  const constraints = [orderBy('name')];
  if (status) constraints.unshift(where('status', '==', status));
  const snap = await getDocs(query(q, ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Update a user's profile (non-role fields) */
export async function updateUser(uid, data) {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Promote a user's role — only callable by admin.
 * Client enforces this via ProtectedRoute; Firestore rules enforce it server-side.
 */
export async function setUserRole(uid, role, actorUid) {
  await updateDoc(doc(db, 'users', uid), {
    role,
    updatedAt: serverTimestamp(),
  });
  // Log activity
  const { logActivity } = await import('./activityLogService');
  await logActivity({
    userId: actorUid,
    action: 'user.role_changed',
    entityType: 'user',
    entityId: uid,
    details: { newRole: role },
  });
}

/** Deactivate / reactivate a user */
export async function setUserStatus(uid, status, actorUid) {
  await updateDoc(doc(db, 'users', uid), {
    status,
    updatedAt: serverTimestamp(),
  });
  const { logActivity } = await import('./activityLogService');
  await logActivity({
    userId: actorUid,
    action: `user.${status}`,
    entityType: 'user',
    entityId: uid,
    details: { status },
  });
}
