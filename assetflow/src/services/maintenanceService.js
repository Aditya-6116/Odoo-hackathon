import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, orderBy, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { logActivity } from './activityLogService';
import { writeNotification } from './notificationService';

/** Raise a maintenance request */
export async function raiseMaintenance(data, actorUid) {
  const ref = await addDoc(collection(db, 'maintenanceRequests'), {
    assetId:          data.assetId,
    assetTag:         data.assetTag,
    raisedByUserId:   actorUid,
    issueDescription: data.issueDescription,
    priority:         data.priority ?? 'Medium',
    photos:           [],
    status:           'Pending',
    approvedByUserId: null,
    technicianId:     null,
    resolutionNotes:  null,
    createdAt:        serverTimestamp(),
    resolvedAt:       null,
  });

  await logActivity({
    userId: actorUid, action: 'maintenance.raised',
    entityType: 'maintenanceRequest', entityId: ref.id,
    details: { assetTag: data.assetTag, priority: data.priority },
  });

  return ref.id;
}

/** Approve maintenance → flips asset status to Under Maintenance */
export async function approveMaintenance(requestId, assetId, actorUid) {
  const batch = writeBatch(db);
  const now   = serverTimestamp();

  batch.update(doc(db, 'maintenanceRequests', requestId), {
    status:           'Approved',
    approvedByUserId: actorUid,
    updatedAt:        now,
  });
  batch.update(doc(db, 'assets', assetId), {
    status:    'Under Maintenance',
    updatedAt: now,
  });

  await batch.commit();
  await logActivity({
    userId: actorUid, action: 'maintenance.approved',
    entityType: 'maintenanceRequest', entityId: requestId,
    details: { assetId },
  });
}

/** Reject maintenance request */
export async function rejectMaintenance(requestId, actorUid) {
  await updateDoc(doc(db, 'maintenanceRequests', requestId), {
    status:           'Rejected',
    approvedByUserId: actorUid,
    updatedAt:        serverTimestamp(),
  });
  await logActivity({
    userId: actorUid, action: 'maintenance.rejected',
    entityType: 'maintenanceRequest', entityId: requestId, details: {},
  });
}

/** Assign technician */
export async function assignTechnician(requestId, technicianId, actorUid) {
  await updateDoc(doc(db, 'maintenanceRequests', requestId), {
    status:       'Technician Assigned',
    technicianId,
    updatedAt:    serverTimestamp(),
  });
}

/** Mark In Progress */
export async function startMaintenance(requestId, actorUid) {
  await updateDoc(doc(db, 'maintenanceRequests', requestId), {
    status:    'In Progress',
    updatedAt: serverTimestamp(),
  });
}

/** Resolve maintenance → flips asset status back to Available */
export async function resolveMaintenance(requestId, assetId, notes, actorUid) {
  const batch = writeBatch(db);
  const now   = serverTimestamp();

  batch.update(doc(db, 'maintenanceRequests', requestId), {
    status:          'Resolved',
    resolutionNotes: notes ?? null,
    resolvedAt:      now,
    updatedAt:       now,
  });
  batch.update(doc(db, 'assets', assetId), {
    status:    'Available',
    updatedAt: now,
  });

  await batch.commit();
  await logActivity({
    userId: actorUid, action: 'maintenance.resolved',
    entityType: 'maintenanceRequest', entityId: requestId,
    details: { notes },
  });
}

/** List maintenance requests */
export async function getMaintenanceRequests({ status, assetId } = {}) {
  const constraints = [orderBy('createdAt', 'desc')];
  if (status)  constraints.unshift(where('status', '==', status));
  if (assetId) constraints.unshift(where('assetId', '==', assetId));
  const snap = await getDocs(query(collection(db, 'maintenanceRequests'), ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
