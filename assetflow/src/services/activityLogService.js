import {
  collection, addDoc, getDocs,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

/** Append an immutable activity log entry */
export async function logActivity({ userId, action, entityType, entityId, details }) {
  await addDoc(collection(db, 'activityLogs'), {
    userId,
    action,
    entityType,
    entityId,
    details:   details ?? {},
    timestamp: serverTimestamp(),
  });
}

/** Fetch recent activity logs (org-wide) */
export async function getActivityLogs({ pageLimit = 100 } = {}) {
  const snap = await getDocs(
    query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(pageLimit))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
