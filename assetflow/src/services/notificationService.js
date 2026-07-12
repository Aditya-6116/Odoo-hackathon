import {
  collection, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Write a notification document.
 * Called by service functions alongside their primary write — never directly by UI.
 */
export async function writeNotification({ userId, type, message, relatedEntityType, relatedEntityId }) {
  await addDoc(collection(db, 'notifications'), {
    userId,
    type,
    message,
    relatedEntityType: relatedEntityType ?? '',
    relatedEntityId:   relatedEntityId ?? '',
    isRead:            false,
    createdAt:         serverTimestamp(),
  });
}
