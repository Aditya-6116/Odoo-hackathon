import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, orderBy, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { logActivity } from './activityLogService';
import { writeNotification } from './notificationService';

/** Create a transfer request */
export async function createTransferRequest(data, actorUid) {
  const ref = await addDoc(collection(db, 'transferRequests'), {
    assetId:            data.assetId,
    assetTag:           data.assetTag,
    currentAllocationId: data.currentAllocationId,
    fromHolderId:       data.fromHolderId,
    fromHolderType:     data.fromHolderType,
    toHolderId:         data.toHolderId,
    toHolderType:       data.toHolderType,
    toHolderName:       data.toHolderName,
    requestedByUserId:  actorUid,
    status:             'requested',
    approvedByUserId:   null,
    requestDate:        serverTimestamp(),
    decisionDate:       null,
  });

  await logActivity({
    userId: actorUid, action: 'transfer.requested',
    entityType: 'transferRequest', entityId: ref.id,
    details: { assetTag: data.assetTag, to: data.toHolderName },
  });

  return ref.id;
}

/** Approve or reject a transfer request */
export async function decideTransferRequest(requestId, request, decision, actorUid) {
  const batch = writeBatch(db);
  const now   = serverTimestamp();

  batch.update(doc(db, 'transferRequests', requestId), {
    status:           decision,   // 'approved' | 'rejected'
    approvedByUserId: actorUid,
    decisionDate:     now,
  });

  if (decision === 'approved') {
    // Close old allocation
    batch.update(doc(db, 'allocations', request.currentAllocationId), {
      status:          'returned',
      actualReturnDate: now,
      updatedAt:        now,
    });

    // Update asset's current holder
    batch.update(doc(db, 'assets', request.assetId), {
      currentHolderType: request.toHolderType,
      currentHolderId:   request.toHolderId,
      currentHolderName: request.toHolderName,
      status:            'Allocated',
      updatedAt:         now,
    });

    // Notify requester
    await writeNotification({
      userId: request.requestedByUserId,
      type: 'TransferApproved',
      message: `Your transfer request for ${request.assetTag} has been approved.`,
      relatedEntityType: 'transferRequest',
      relatedEntityId: requestId,
    });
  }

  await batch.commit();

  await logActivity({
    userId: actorUid, action: `transfer.${decision}`,
    entityType: 'transferRequest', entityId: requestId,
    details: { assetTag: request.assetTag },
  });
}

/** Get all transfer requests */
export async function getTransferRequests({ status } = {}) {
  const constraints = [orderBy('requestDate', 'desc')];
  if (status) constraints.unshift(where('status', '==', status));
  const snap = await getDocs(query(collection(db, 'transferRequests'), ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
