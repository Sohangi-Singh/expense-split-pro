/**
 * seedDemoData — populates Firestore with realistic demo data
 * for the logged-in user so the app is ready to demo immediately.
 *
 * Creates:
 *   • 2 groups  (Goa Trip 2025, Flat 4B)
 *   • 8 expenses across both groups
 *   • 1 settlement
 *
 * Fake members use placeholder UIDs so the current user always
 * appears as payer/participant with meaningful balances.
 */

import { addExpense }     from '../services/expenseService';
import { createGroup }    from '../services/groupService';
import { recordSettlement } from '../services/settlementService';
import { calculateSplit } from './splitCalculator';

// Stable fake UIDs — safe to use repeatedly (no auth needed)
const FAKE = {
  raj:    { uid: 'demo_raj_001',   name: 'Raj Mehta',     email: 'raj@demo.com'    },
  priya:  { uid: 'demo_priya_001', name: 'Priya Sharma',  email: 'priya@demo.com'  },
  aditya: { uid: 'demo_aditya_01', name: 'Aditya Kumar',  email: 'aditya@demo.com' },
};

async function makeExpense(groupId, { desc, amount, payerId, payerName, participants, category, members }) {
  const shares = calculateSplit(amount, payerId, participants, 'equal');
  return addExpense(groupId, {
    description: desc,
    amount,
    payerId,
    payerName,
    splitType:    'equal',
    participants,
    shares,
    category,
    settled:      false,
  });
}

export async function seedDemoData(user) {
  const me = {
    uid:   user.uid,
    name:  user.displayName || user.email?.split('@')[0] || 'You',
    email: user.email,
    role:  'admin',
  };

  // ── Group 1: Goa Trip ──────────────────────────────────────────
  const goaId = await createGroup({
    name:        'Goa Trip 2025',
    description: 'End-sem trip with the squad 🏖️',
    category:    'Trip',
    creatorUid:   me.uid,
    creatorName:  me.name,
    creatorEmail: me.email,
  });

  // Manually patch members into the group doc (createGroup adds only creator)
  const { updateDoc, doc, arrayUnion } = await import('firebase/firestore');
  const { db } = await import('../services/firebase');

  const goaMembers = [FAKE.raj, FAKE.priya, FAKE.aditya];
  await updateDoc(doc(db, 'groups', goaId), {
    members: arrayUnion(...goaMembers.map((m) => ({ ...m, role: 'member' }))),
  });

  const goaAll = [me.uid, FAKE.raj.uid, FAKE.priya.uid, FAKE.aditya.uid];

  const goaExpenses = [
    { desc: 'Hotel Booking (2 nights)',  amount: 8000, payerId: me.uid,       payerName: me.name,       category: 'Travel'       },
    { desc: 'Dinner at Curlies Beach',   amount: 2400, payerId: FAKE.raj.uid,  payerName: FAKE.raj.name, category: 'Food & Drinks' },
    { desc: 'Scooter Rental',            amount: 1600, payerId: FAKE.priya.uid,payerName: FAKE.priya.name,category: 'Transport'   },
    { desc: 'Club Entry + Drinks',       amount: 3200, payerId: me.uid,       payerName: me.name,       category: 'Entertainment' },
    { desc: 'Breakfast x3 days',         amount: 900,  payerId: FAKE.aditya.uid,payerName:FAKE.aditya.name,category:'Food & Drinks'},
  ];

  for (const exp of goaExpenses) {
    await makeExpense(goaId, { ...exp, participants: goaAll });
  }

  // ── Group 2: Flat 4B ──────────────────────────────────────────
  const flatId = await createGroup({
    name:        'Flat 4B',
    description: 'Monthly flat expenses 🏠',
    category:    'Home',
    creatorUid:   me.uid,
    creatorName:  me.name,
    creatorEmail: me.email,
  });

  const flatMembers = [FAKE.raj, FAKE.priya];
  await updateDoc(doc(db, 'groups', flatId), {
    members: arrayUnion(...flatMembers.map((m) => ({ ...m, role: 'member' }))),
  });

  const flatAll = [me.uid, FAKE.raj.uid, FAKE.priya.uid];

  const flatExpenses = [
    { desc: 'Electricity Bill – April', amount: 2100, payerId: me.uid,       payerName: me.name,       category: 'Utilities'     },
    { desc: 'Groceries (Big Basket)',    amount: 1800, payerId: FAKE.raj.uid,  payerName: FAKE.raj.name, category: 'Food & Drinks' },
    { desc: 'WiFi Recharge',             amount: 999,  payerId: FAKE.priya.uid,payerName: FAKE.priya.name,category: 'Utilities'   },
  ];

  for (const exp of flatExpenses) {
    await makeExpense(flatId, { ...exp, participants: flatAll });
  }

  // ── Settlement: Raj settles partial debt in Flat ───────────────
  await recordSettlement({
    groupId:  flatId,
    from:     FAKE.raj.uid,
    to:       me.uid,
    fromName: FAKE.raj.name,
    toName:   me.name,
    amount:   700,
    note:     'Partial payment via GPay',
  });

  return { goaId, flatId };
}
