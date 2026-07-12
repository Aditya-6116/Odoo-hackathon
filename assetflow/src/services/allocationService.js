import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, orderBy, runTransaction, writeBatch,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { logActivity } from './activityLogService';
import { writeNotification } from './notificationService';

/** Check + create allocation (double-allocation prevention via transaction) */
export async function createAllocation(data, actorUid) {
  const {
    assetId, assetTag,
    allocatedToType, allocatedToId, allocatedToName,
    expectedReturnDate,
  } = data;

  return runTransaction(db, async (tx) => {
    // Check for existing active allocation
    const activeSnap = await getDocs(
      query(
        collection(db, 'allocations'),
        where('assetId', '==', assetId),
        where('status', '==', 'active'),
      )
    );

    if (!activeSnap.empty) {
      const existing = activeSnap.docs[0].data();
      throw new Error(
        `Asset is already allocated to ${existing.allocatedToName}. Use Transfer Request instead.`
      );
    }

    // Create allocation doc
    const allocRef = doc(collection(db, 'allocations'));
    const now = serverTimestamp();
    tx.set(allocRef, {
      assetId,
      assetTag,
      allocatedToType,
      allocatedToId,
      allocatedToName,
      allocatedByUserId: actorUid,
      allocationDate:    now,
      expectedReturnDate: expectedReturnDate
        ? Timestamp.fromDate(new Date(expectedReturnDate))
        : null,
      actualReturnDate:  null,
      status:            'active',
      returnConditionNotes: null,
      createdAt:         now,
      updatedAt:         now,
    });

    // Update asset
    tx.update(doc(db, 'assets', assetId), {
      status:            'Allocated',
      currentHolderType: allocatedToType,
      currentHolderId:   allocatedToId,
      currentHolderName: allocatedToName,
      updatedAt:         now,
    });

    return allocRef.id;
  }).then(async (allocId) => {
    await logActivity({
      userId: actorUid, action: 'asset.allocated',
      entityType: 'allocation', entityId: allocId,
      details: { assetTag, allocatedToName },
    });
    // Notify recipient if it's a user
    if (allocatedToType === 'employee') {
      await writeNotification({
        userId: allocatedToId,
        type: 'AssetAssigned',
        message: `Asset ${assetTag} has been allocated to you.`,
        relatedEntityType: 'allocation',
        relatedEntityId: allocId,
      });
    }
    return allocId;
  });
}

/** Process an asset return */
export async function processReturn(allocationId, assetId, notes, actorUid) {
  const batch = writeBatch(db);
  const now   = serverTimestamp();

  batch.update(doc(db, 'allocations', allocationId), {
    status:               'returned',
    actualReturnDate:     now,
    returnConditionNotes: notes ?? null,
    updatedAt:            now,
  });
  batch.update(doc(db, 'assets', assetId), {
    status:            'Available',
    currentHolderType: null,
    currentHolderId:   null,
    currentHolderName: null,
    updatedAt:         now,
  });

  await batch.commit();
  await logActivity({
    userId: actorUid, action: 'asset.returned',
    entityType: 'allocation', entityId: allocationId,
    details: { notes },
  });
}

/** Get all active allocations */
export async function getActiveAllocations() {
  const snap = await getDocs(
    query(collection(db, 'allocations'), where('status', '==', 'active'), orderBy('allocationDate', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Get overdue allocations */
export async function getOverdueAllocations() {
  const snap = await getDocs(
    query(collection(db, 'allocations'), where('status', '==', 'overdue'), orderBy('expectedReturnDate'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Get allocations for a specific asset */
export async function getAllocationsForAsset(assetId) {
  const snap = await getDocs(
    query(collection(db, 'allocations'), where('assetId', '==', assetId), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Mark allocations overdue (run on dashboard mount as lightweight sweep) */
export async function sweepOverdueAllocations() {
  const now = Timestamp.now();
  const snap = await getDocs(
    query(
      collection(db, 'allocations'),
      where('status', '==', 'active'),
      where('expectedReturnDate', '<', now),
    )
  );
  const batch = writeBatch(db);
  snap.docs.forEach(d => {
    batch.update(d.ref, { status: 'overdue', updatedAt: serverTimestamp() });
  });
  if (!snap.empty) await batch.commit();
  return snap.size;
}
