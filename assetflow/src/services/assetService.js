import {
  collection, doc, addDoc, getDoc, updateDoc, getDocs,
  query, where, orderBy, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { logActivity } from './activityLogService';

/** Generate next asset tag via atomic counter */
async function nextAssetTag(tx) {
  const counterRef = doc(db, 'counters', 'assetTag');
  const snap = await tx.get(counterRef);
  const lastValue = snap.exists() ? snap.data().lastValue : 0;
  const next = lastValue + 1;
  tx.set(counterRef, { lastValue: next });
  return `AF-${String(next).padStart(4, '0')}`;
}

/** Register a new asset */
export async function createAsset(data, actorUid) {
  return runTransaction(db, async (tx) => {
    const assetTag = await nextAssetTag(tx);
    const assetRef = doc(collection(db, 'assets'));

    const assetData = {
      assetTag,
      name:                data.name,
      categoryId:          data.categoryId,
      categoryName:        data.categoryName ?? '',
      serialNumber:        data.serialNumber ?? '',
      qrCode:              assetTag,
      acquisitionDate:     data.acquisitionDate ?? serverTimestamp(),
      acquisitionCost:     data.acquisitionCost ?? 0,
      condition:           data.condition ?? 'Good',
      location:            data.location ?? '',
      photos:              [],
      documents:           [],
      isBookable:          data.isBookable ?? false,
      status:              'Available',
      currentHolderType:   null,
      currentHolderId:     null,
      currentHolderName:   null,
      customFieldValues:   data.customFieldValues ?? {},
      createdAt:           serverTimestamp(),
      updatedAt:           serverTimestamp(),
    };

    tx.set(assetRef, assetData);
    return { id: assetRef.id, assetTag };
  }).then(async ({ id, assetTag }) => {
    await logActivity({
      userId: actorUid, action: 'asset.registered',
      entityType: 'asset', entityId: id,
      details: { assetTag, name: data.name },
    });
    return { id, assetTag };
  });
}

/** List assets with optional filters */
export async function getAssets({ status, categoryId, search } = {}) {
  let constraints = [orderBy('assetTag')];
  if (status) constraints.unshift(where('status', '==', status));
  if (categoryId) constraints.unshift(where('categoryId', '==', categoryId));

  const snap = await getDocs(query(collection(db, 'assets'), ...constraints));
  let assets = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Client-side text search (Firestore doesn't do full-text)
  if (search) {
    const s = search.toLowerCase();
    assets = assets.filter(a =>
      a.name?.toLowerCase().includes(s) ||
      a.assetTag?.toLowerCase().includes(s) ||
      a.serialNumber?.toLowerCase().includes(s) ||
      a.location?.toLowerCase().includes(s)
    );
  }

  return assets;
}

/** Get a single asset */
export async function getAsset(id) {
  const snap = await getDoc(doc(db, 'assets', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Update asset details */
export async function updateAsset(id, data, actorUid) {
  await updateDoc(doc(db, 'assets', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  await logActivity({
    userId: actorUid, action: 'asset.updated',
    entityType: 'asset', entityId: id,
    details: data,
  });
}

/** Retire or dispose an asset (admin/asset_manager only) */
export async function setAssetLifecycleStatus(id, status, actorUid) {
  await updateDoc(doc(db, 'assets', id), {
    status,
    updatedAt: serverTimestamp(),
  });
  await logActivity({
    userId: actorUid, action: `asset.${status.toLowerCase()}`,
    entityType: 'asset', entityId: id,
    details: { status },
  });
}

/**
 * Get asset history: allocations + maintenance requests for a given assetId,
 * merged and sorted by date.
 */
export async function getAssetHistory(assetId) {
  const [allocSnap, maintSnap] = await Promise.all([
    getDocs(query(collection(db, 'allocations'), where('assetId', '==', assetId), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, 'maintenanceRequests'), where('assetId', '==', assetId), orderBy('createdAt', 'desc'))),
  ]);

  const allocs = allocSnap.docs.map(d => ({ id: d.id, _type: 'allocation', ...d.data() }));
  const maints = maintSnap.docs.map(d => ({ id: d.id, _type: 'maintenance', ...d.data() }));

  return [...allocs, ...maints].sort((a, b) => {
    const ta = a.createdAt?.seconds ?? 0;
    const tb = b.createdAt?.seconds ?? 0;
    return tb - ta;
  });
}
