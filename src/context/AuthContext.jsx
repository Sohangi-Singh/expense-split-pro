import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { getUserProfile, signIn, signUp, logOut, subscribeToAuthChanges } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // Firebase Auth user object
  const [profile, setProfile] = useState(null);   // Firestore user document
  const [loading, setLoading] = useState(true);   // true while checking persisted session

  // ── Listen to Firebase Auth state changes ─────────────────────────
  // onAuthStateChanged fires immediately with the current user (or null),
  // which gives us persistent login across page refreshes.
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load the richer Firestore profile (name, groups, etc.)
        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    // Cleanup listener on unmount
    return unsubscribe;
  }, []);

  // ── Auth actions wrapped in useCallback for stable references ─────
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const firebaseUser = await signIn(email, password);
      return firebaseUser;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const firebaseUser = await signUp(name, email, password);
      return firebaseUser;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logOut();
    setUser(null);
    setProfile(null);
  }, []);

  // ── Memoize context value to avoid unnecessary re-renders ─────────
  const value = useMemo(() => ({
    user,
    profile,
    loading,
    login,
    register,
    logout,
  }), [user, profile, loading, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
