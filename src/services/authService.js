import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// ── Sign Up ────────────────────────────────────────────────────────
export async function signUp(name, email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Set display name on the Firebase Auth profile
  await updateProfile(user, { displayName: name });

  // Create a user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid:       user.uid,
    name,
    email,
    createdAt: serverTimestamp(),
    groups:    [],
  });

  return user;
}

// ── Sign In ────────────────────────────────────────────────────────
export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ── Sign Out ───────────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth);
}

// ── Get user profile from Firestore ───────────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ── Auth state listener (used in AuthContext) ──────────────────────
// Returns an unsubscribe function — call it in useEffect cleanup
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}
