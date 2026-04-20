import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getUserProfile, signIn, signUp, logOut, subscribeToAuthChanges } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      // Always call setLoading(false) — wrap everything in try/finally
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          let userProfile = await getUserProfile(firebaseUser.uid);

          // Auto-create the Firestore user doc if it's missing
          // (can happen if signup's setDoc failed, or on first login)
          if (!userProfile) {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              uid:       firebaseUser.uid,
              name:      firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
              email:     firebaseUser.email || '',
              groups:    [],
              createdAt: serverTimestamp(),
            }, { merge: true });
            userProfile = await getUserProfile(firebaseUser.uid);
          }

          setProfile(userProfile);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        // If Firestore is unreachable or rules block us, still unblock the UI
        console.error('[AuthContext] Error during auth state change:', err);
        if (firebaseUser) setUser(firebaseUser);
      } finally {
        // This ALWAYS runs — prevents the app from being stuck on the loading screen
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email, password) => {
    const firebaseUser = await signIn(email, password);
    return firebaseUser;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const firebaseUser = await signUp(name, email, password);
    return firebaseUser;
  }, []);

  const logout = useCallback(async () => {
    await logOut();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(() => ({
    user, profile, loading, login, register, logout,
  }), [user, profile, loading, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
