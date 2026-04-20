import {
  collection, addDoc, getDocs, query,
  orderBy, serverTimestamp, where,
} from 'firebase/firestore';
import { db } from './firebase';

// Settlements live at: groups/{groupId}/settlements/{id}
function settlementsCol(groupId) {
  return collection(db, 'groups', groupId, 'settlements');
}

// ── Record a settlement ────────────────────────────────────────────
export async function recordSettlement({ groupId, from, to, amount, fromName, toName, note = '' }) {
  const ref = await addDoc(settlementsCol(groupId), {
    from,
    to,
    fromName,
    toName,
    amount,
    note:      note.trim(),
    settledAt: serverTimestamp(),
  });
  return { id: ref.id, groupId, from, to, fromName, toName, amount, note };
}

// ── Fetch all settlements for a group ──────────────────────────────
export async function fetchGroupSettlements(groupId) {
  const q    = query(settlementsCol(groupId), orderBy('settledAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, groupId, ...d.data() }));
}

// ── Fetch settlements across multiple groups ────────────────────────
export async function fetchAllSettlements(groupIds = []) {
  if (!groupIds.length) return [];
  const results = await Promise.all(groupIds.map(fetchGroupSettlements));
  return results.flat().sort((a, b) => {
    const ta = a.settledAt?.toMillis?.() || 0;
    const tb = b.settledAt?.toMillis?.() || 0;
    return tb - ta;
  });
}

// ── Compute how much of a raw debt has been settled ─────────────────
// Returns a map: { `${from}→${to}`: totalSettled }
export function buildSettledMap(settlements = []) {
  const map = {};
  for (const s of settlements) {
    const key = `${s.from}→${s.to}`;
    map[key] = (map[key] || 0) + (s.amount || 0);
  }
  return map;
}
