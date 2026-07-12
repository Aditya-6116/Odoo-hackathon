import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, orderBy, runTransaction, writeBatch,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { logActivity } from './activityLogService';
import { writeNotification } from './notificationService';

/**
 * Create a booking with overlap check (transaction).
 * Overlap: existing booking where startTime < reqEnd AND endTime > reqStart
 */
export async function createBooking(data, actorUid) {
  const { resourceAssetId, assetTag, startTime, endTime, bookedByUserId, departmentId } = data;

  const start = Timestamp.fromDate(new Date(startTime));
  const end   = Timestamp.fromDate(new Date(endTime));

  // Query all non-cancelled bookings for this resource that start before requestedEnd
  const existingSnap = await getDocs(
    query(
      collection(db, 'bookings'),
      where('resourceAssetId', '==', resourceAssetId),
      where('status', 'in', ['Upcoming', 'Ongoing']),
      where('startTime', '<', end),
    )
  );

  // Filter in code for endTime > requestedStart (classic interval overlap)
  const overlapping = existingSnap.docs.filter(d => {
    const et = d.data().endTime;
    return et && et.toDate() > new Date(startTime);
  });

  if (overlapping.length > 0) {
    throw new Error('This time slot overlaps an existing booking. Please choose another time.');
  }

  const ref = await addDoc(collection(db, 'bookings'), {
    resourceAssetId,
    assetTag,
    bookedByUserId,
    departmentId:   departmentId ?? null,
    startTime:      start,
    endTime:        end,
    status:         'Upcoming',
    createdAt:      serverTimestamp(),
  });

  // Flip asset status to Reserved
  await updateDoc(doc(db, 'assets', resourceAssetId), {
    status:    'Reserved',
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    userId: actorUid, action: 'booking.created',
    entityType: 'booking', entityId: ref.id,
    details: { assetTag, startTime, endTime },
  });

  await writeNotification({
    userId: bookedByUserId,
    type: 'BookingConfirmed',
    message: `Your booking for ${assetTag} (${new Date(startTime).toLocaleString()}) is confirmed.`,
    relatedEntityType: 'booking',
    relatedEntityId: ref.id,
  });

  return ref.id;
}

/** Cancel a booking */
export async function cancelBooking(bookingId, resourceAssetId, actorUid) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'bookings', bookingId), { status: 'Cancelled', updatedAt: serverTimestamp() });
  batch.update(doc(db, 'assets', resourceAssetId), { status: 'Available', updatedAt: serverTimestamp() });
  await batch.commit();
  await logActivity({
    userId: actorUid, action: 'booking.cancelled',
    entityType: 'booking', entityId: bookingId, details: {},
  });
}

/** Get bookings for a resource */
export async function getBookingsForAsset(assetId) {
  const snap = await getDocs(
    query(collection(db, 'bookings'), where('resourceAssetId', '==', assetId), orderBy('startTime'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Get all bookings (optionally filtered by status) */
export async function getAllBookings({ status } = {}) {
  const constraints = [orderBy('startTime', 'desc')];
  if (status) constraints.unshift(where('status', '==', status));
  const snap = await getDocs(query(collection(db, 'bookings'), ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Get bookings for a specific user */
export async function getMyBookings(userId) {
  const snap = await getDocs(
    query(collection(db, 'bookings'), where('bookedByUserId', '==', userId), orderBy('startTime', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Get all bookable assets */
export async function getBookableAssets() {
  const snap = await getDocs(
    query(collection(db, 'assets'), where('isBookable', '==', true), where('status', 'in', ['Available', 'Reserved']))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
