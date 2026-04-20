import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, setDoc,
  query, orderBy, where, serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

// DM id is always the two UIDs sorted and joined: "uid1_uid2"
export function dmId(uidA, uidB) {
  return [uidA, uidB].sort().join('_');
}

// ── Get or create DM doc ──────────────────────────────────────────
export async function getOrCreateDM(myUid, myName, myEmail, otherUid, otherName, otherEmail) {
  const id  = dmId(myUid, otherUid);
  const ref = doc(db, 'dms', id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [
        { uid: myUid,    name: myName,    email: myEmail    },
        { uid: otherUid, name: otherName, email: otherEmail },
      ],
      participantUids: [myUid, otherUid].sort(),
      // balance > 0  → otherUid owes myUid
      // balance < 0  → myUid owes otherUid
      // stored per-user: balances[uid] = amount they are owed by the other
      balances: { [myUid]: 0, [otherUid]: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return id;
}

// ── Send a message (text / charge / pay / settle) ─────────────────
export async function sendMessage(dmDocId, senderUid, type, text, amount = 0) {
  const msgRef = await addDoc(collection(db, 'dms', dmDocId, 'messages'), {
    senderUid,
    type,   // 'text' | 'charge' | 'pay' | 'settle'
    text,
    amount,
    createdAt: serverTimestamp(),
  });

  // Update balance on the dm doc
  if (type === 'charge' || type === 'pay' || type === 'settle') {
    const dmSnap = await getDoc(doc(db, 'dms', dmDocId));
    const data   = dmSnap.data();
    const [uid1, uid2] = data.participantUids;
    const otherUid = senderUid === uid1 ? uid2 : uid1;

    const currentBalance = data.balances?.[senderUid] ?? 0;
    let newBalance = currentBalance;

    if (type === 'charge') {
      // sender says "you owe me X" → sender's receivable goes up
      newBalance = currentBalance + amount;
    } else if (type === 'pay') {
      // sender says "I paid you X" → sender's receivable goes down (they owed)
      newBalance = currentBalance - amount;
    } else if (type === 'settle') {
      // full clear
      newBalance = 0;
    }

    await updateDoc(doc(db, 'dms', dmDocId), {
      [`balances.${senderUid}`]: newBalance,
      [`balances.${otherUid}`]: -newBalance,
      updatedAt: serverTimestamp(),
    });

    // Also store daily snapshot for graph
    const today = new Date().toISOString().split('T')[0];
    await setDoc(doc(db, 'dms', dmDocId, 'balanceHistory', today), {
      date: today,
      [`balance_${senderUid}`]: newBalance,
      [`balance_${otherUid}`]: -newBalance,
    }, { merge: true });
  }

  return msgRef.id;
}

// ── Subscribe to messages (real-time) ─────────────────────────────
export function subscribeToMessages(dmDocId, callback) {
  const q = query(
    collection(db, 'dms', dmDocId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ── Get DM doc (one-shot) ─────────────────────────────────────────
export async function getDM(dmDocId) {
  const snap = await getDoc(doc(db, 'dms', dmDocId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── List all DMs for a user ───────────────────────────────────────
export async function getUserDMs(uid) {
  const q    = query(collection(db, 'dms'), where('participantUids', 'array-contains', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Fetch balance history for graph ──────────────────────────────
export async function getBalanceHistory(dmDocId) {
  const snap = await getDocs(collection(db, 'dms', dmDocId, 'balanceHistory'));
  return snap.docs
    .map((d) => ({ date: d.id, ...d.data() }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Search registered users by name/email ────────────────────────
export async function searchUsers(searchTerm, myUid) {
  const snap = await getDocs(collection(db, 'users'));
  const term = searchTerm.toLowerCase();
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter((u) => u.uid !== myUid && (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    ))
    .slice(0, 10);
}
