import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);   // Firebase Auth user
  const [userProfile, setUserProfile] = useState(null);   // Firestore users/{uid}
  const [loading, setLoading]         = useState(true);

  /* ── Listen to auth state ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await fetchProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ── Fetch Firestore profile ── */
  async function fetchProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  /* ── Login ── */
  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchProfile(cred.user.uid);
    setUserProfile(profile);
    return cred;
  }

  /* ── Signup — always creates role: employee ── */
  async function signup(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profile = {
      uid:             cred.user.uid,
      name,
      email,
      phone:           null,
      departmentId:    null,
      departmentName:  '',
      role:            'employee',        // hardcoded — never client-assignable
      status:          'active',
      createdAt:       serverTimestamp(),
      updatedAt:       serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    setUserProfile({ id: cred.user.uid, ...profile });
    return cred;
  }

  /* ── Logout ── */
  function logout() {
    return signOut(auth);
  }

  /* ── Password reset ── */
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  const role = userProfile?.role ?? null;

  return (
    <AuthContext.Provider value={{
      user, userProfile, role, loading,
      login, signup, logout, resetPassword,
      refreshProfile: () => user && fetchProfile(user.uid).then(setUserProfile),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
