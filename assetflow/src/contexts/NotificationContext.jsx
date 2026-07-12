import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection, query, where, orderBy, limit,
  onSnapshot, updateDoc, doc, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  useEffect(() => {
    if (!user) { setNotifications([]); setUnreadCount(0); return; }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50),
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(docs);
      setUnreadCount(docs.filter(n => !n.isRead).length);
    });

    return unsub;
  }, [user]);

  async function markRead(notificationId) {
    await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
  }

  async function markAllRead() {
    const batch = writeBatch(db);
    notifications
      .filter(n => !n.isRead)
      .forEach(n => batch.update(doc(db, 'notifications', n.id), { isRead: true }));
    await batch.commit();
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
