import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where,
  serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Helpers ───────────────────────────────────────────────────────
function randomInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── Create ────────────────────────────────────────────────────────
export async function createGroup({ name, description = '', category = 'Other', creatorUid, creatorName, creatorEmail }) {
  const groupRef = await addDoc(collection(db, 'groups'), {
    name,
    description,
    category,
    createdBy:  creatorUid,
    createdAt:  serverTimestamp(),
    inviteCode: randomInviteCode(),
    members: [
      { uid: creatorUid, name: creatorName, email: creatorEmail, role: 'admin' },
    ],
    totalExpenses: 0,
  });

  // Add groupId to the creator's user doc
  await updateDoc(doc(db, 'users', creatorUid), {
    groups: arrayUnion(groupRef.id),
  });

  return groupRef.id;
}

// ── Read: all groups the user belongs to ──────────────────────────
export async function fetchUserGroups(uid) {
  // Query groups where the members array contains an entry with this uid
  const q = query(
    collection(db, 'groups'),
    where('members', 'array-contains-any', [
      { uid, role: 'admin' },
      { uid, role: 'member' },
    ])
  );

  // Firestore array-contains-any with objects is unreliable across SDKs,
  // so we also fall back to fetching the user doc's groups array.
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) return [];

  const groupIds = userSnap.data().groups || [];
  if (groupIds.length === 0) return [];

  // Batch fetch (Firestore getDoc per id is fine for small counts)
  const snaps = await Promise.all(
    groupIds.map((id) => getDoc(doc(db, 'groups', id)))
  );

  return snaps
    .filter((s) => s.exists())
    .map((s) => ({ id: s.id, ...s.data() }));
}

// ── Read: single group ────────────────────────────────────────────
export async function fetchGroup(groupId) {
  const snap = await getDoc(doc(db, 'groups', groupId));
  if (!snap.exists()) throw new Error('Group not found');
  return { id: snap.id, ...snap.data() };
}

// ── Update group meta ─────────────────────────────────────────────
export async function updateGroup(groupId, updates) {
  await updateDoc(doc(db, 'groups', groupId), { ...updates, updatedAt: serverTimestamp() });
}

// ── Add member by email (looks up users collection) ───────────────
export async function addMemberByEmail(groupId, email) {
  const q     = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
  const snap  = await getDocs(q);
  if (snap.empty) throw new Error(`No user found with email "${email}".`);

  const userDoc  = snap.docs[0];
  const userData = userDoc.data();
  const newMember = { uid: userDoc.id, name: userData.name, email: userData.email, role: 'member' };

  // Check not already a member
  const groupSnap = await getDoc(doc(db, 'groups', groupId));
  const existing  = groupSnap.data().members || [];
  if (existing.some((m) => m.uid === userDoc.id)) {
    throw new Error(`${userData.name} is already in this group.`);
  }

  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayUnion(newMember),
  });
  await updateDoc(doc(db, 'users', userDoc.id), {
    groups: arrayUnion(groupId),
  });

  return newMember;
}

// ── Join by invite code ───────────────────────────────────────────
export async function joinGroupByCode(inviteCode, uid, name, email) {
  const q    = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode.trim().toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Invalid invite code. Please check and try again.');

  const groupDoc  = snap.docs[0];
  const groupData = groupDoc.data();
  if (groupData.members?.some((m) => m.uid === uid)) {
    throw new Error('You are already a member of this group.');
  }

  const newMember = { uid, name, email, role: 'member' };
  await updateDoc(doc(db, 'groups', groupDoc.id), { members: arrayUnion(newMember) });
  await updateDoc(doc(db, 'users', uid), { groups: arrayUnion(groupDoc.id) });

  return { id: groupDoc.id, ...groupData };
}

// ── Remove member ─────────────────────────────────────────────────
export async function removeMember(groupId, member) {
  await updateDoc(doc(db, 'groups', groupId), { members: arrayRemove(member) });
  await updateDoc(doc(db, 'users', member.uid), { groups: arrayRemove(groupId) });
}

// ── Delete group ──────────────────────────────────────────────────
export async function deleteGroup(groupId, memberUids) {
  await deleteDoc(doc(db, 'groups', groupId));
  // Remove groupId from each member's user doc
  await Promise.all(
    memberUids.map((uid) =>
      updateDoc(doc(db, 'users', uid), { groups: arrayRemove(groupId) })
    )
  );
}
