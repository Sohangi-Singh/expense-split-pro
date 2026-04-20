import {
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from './firebase';

// Expenses live at: groups/{groupId}/expenses/{expenseId}
function expensesCol(groupId) {
  return collection(db, 'groups', groupId, 'expenses');
}

export async function fetchGroupExpenses(groupId) {
  const q    = query(expensesCol(groupId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addExpense(groupId, expenseData) {
  const ref = await addDoc(expensesCol(groupId), {
    ...expenseData,
    groupId,
    createdAt: serverTimestamp(),
  });

  // Increment the group's running total — non-fatal if it fails
  try {
    await updateDoc(doc(db, 'groups', groupId), {
      totalExpenses: increment(expenseData.amount || 0),
    });
  } catch { /* non-fatal */ }

  return { id: ref.id, ...expenseData, groupId };
}

export async function updateExpense(expId, updates) {
  const { groupId, ...rest } = updates;
  if (!groupId) throw new Error('groupId required for updateExpense');
  await updateDoc(doc(db, 'groups', groupId, 'expenses', expId), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteExpense(groupId, expId) {
  await deleteDoc(doc(db, 'groups', groupId, 'expenses', expId));
}
