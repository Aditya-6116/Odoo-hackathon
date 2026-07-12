import {
  collection, doc, addDoc, updateDoc, getDocs, getDoc,
  query, where, orderBy, writeBatch, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { logActivity } from './activityLogService';

/** Create an audit cycle + pre-create auditItems (one per in-scope asset) */
export async function createAuditCycle(data, assets, actorUid) {
  const cycleRef = await addDoc(collection(db, 'auditCycles'), {
    name:              data.name,
    scopeType:         data.scopeType,
    scopeValue:        data.scopeValue,
    dateRangeStart:    Timestamp.fromDate(new Date(data.dateRangeStart)),
    dateRangeEnd:      Timestamp.fromDate(new Date(data.dateRangeEnd)),
    auditorIds:        data.auditorIds ?? [],
    status:            'Open',
    createdByUserId:   actorUid,
    createdAt:         serverTimestamp(),
    closedAt:          null,
  });

  // Pre-create one auditItem per asset
  const batch = writeBatch(db);
  assets.forEach((asset) => {
    const itemRef = doc(collection(db, 'auditItems'));
    batch.set(itemRef, {
      auditCycleId: cycleRef.id,
      assetId:      asset.id,
      assetTag:     asset.assetTag,
      auditorId:    data.auditorIds?.[0] ?? actorUid,
      result:       'Pending',
      notes:        null,
      verifiedAt:   null,
    });
  });
  await batch.commit();

  await logActivity({
    userId: actorUid, action: 'audit.cycle_created',
    entityType: 'auditCycle', entityId: cycleRef.id,
    details: { name: data.name, assetCount: assets.length },
  });

  return cycleRef.id;
}

/** Record audit result for a single item */
export async function recordAuditItem(itemId, result, notes, auditorId) {
  await updateDoc(doc(db, 'auditItems', itemId), {
    result,
    notes:      notes ?? null,
    auditorId,
    verifiedAt: serverTimestamp(),
  });
}

/**
 * Close an audit cycle:
 * - Generate discrepancy report (Missing + Damaged items)
 * - Flip Missing assets to Lost
 */
export async function closeAuditCycle(cycleId, actorUid) {
  // Get all items in this cycle
  const itemsSnap = await getDocs(
    query(collection(db, 'auditItems'), where('auditCycleId', '==', cycleId))
  );
  const items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const flagged = items.filter(i => i.result === 'Missing' || i.result === 'Damaged');

  const batch = writeBatch(db);
  const now   = serverTimestamp();

  // Close the cycle
  batch.update(doc(db, 'auditCycles', cycleId), {
    status:   'Closed',
    closedAt: now,
  });

  // Generate discrepancy report
  const reportRef = doc(collection(db, 'discrepancyReports'));
  batch.set(reportRef, {
    auditCycleId:     cycleId,
    flaggedItems:     flagged.map(i => ({
      assetId:  i.assetId,
      assetTag: i.assetTag,
      result:   i.result,
      notes:    i.notes ?? null,
    })),
    generatedAt:      now,
    resolutionStatus: 'open',
  });

  // Flip Missing assets to Lost
  flagged
    .filter(i => i.result === 'Missing')
    .forEach(i => {
      batch.update(doc(db, 'assets', i.assetId), {
        status:    'Lost',
        updatedAt: now,
      });
    });

  await batch.commit();

  await logActivity({
    userId: actorUid, action: 'audit.cycle_closed',
    entityType: 'auditCycle', entityId: cycleId,
    details: { flaggedCount: flagged.length },
  });

  return reportRef.id;
}

/** Get all audit cycles */
export async function getAuditCycles() {
  const snap = await getDocs(
    query(collection(db, 'auditCycles'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Get audit items for a cycle */
export async function getAuditItems(cycleId) {
  const snap = await getDocs(
    query(collection(db, 'auditItems'), where('auditCycleId', '==', cycleId))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Get discrepancy report for a cycle */
export async function getDiscrepancyReport(cycleId) {
  const snap = await getDocs(
    query(collection(db, 'discrepancyReports'), where('auditCycleId', '==', cycleId))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}
