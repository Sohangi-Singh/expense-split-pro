import { round2 } from './formatters';

/**
 * calculateSplit — core splitting engine.
 *
 * @param {number}   totalAmount  - Total expense amount
 * @param {string}   payerId      - UID of the person who paid
 * @param {string[]} participants - UIDs of everyone sharing the cost
 * @param {'equal'|'unequal'} splitType
 * @param {Object}   customAmounts - { [uid]: amount } — only for 'unequal'
 *
 * @returns {Object[]} shares: [{ uid, amount, owes }]
 *   owes = how much this person owes the payer (0 if they are the payer)
 */
export function calculateSplit(totalAmount, payerId, participants, splitType, customAmounts = {}) {
  if (!participants || participants.length === 0) return [];

  let shares = [];

  if (splitType === 'equal') {
    const perPerson = round2(totalAmount / participants.length);
    // The last person absorbs any rounding remainder
    let distributed = 0;

    shares = participants.map((uid, idx) => {
      const isLast   = idx === participants.length - 1;
      const amount   = isLast ? round2(totalAmount - distributed) : perPerson;
      distributed   += amount;
      return { uid, amount };
    });

  } else {
    // Unequal — use provided custom amounts, default 0 for missing
    shares = participants.map((uid) => ({
      uid,
      amount: round2(customAmounts[uid] || 0),
    }));
  }

  // Attach owes: participant owes the payer their share (payer owes 0)
  return shares.map((s) => ({
    ...s,
    owes: s.uid === payerId ? 0 : s.amount,
  }));
}

/**
 * Validate unequal split: shares must sum to totalAmount (within ₹1 tolerance).
 * Returns null if valid, or an error string.
 */
export function validateUnequalSplit(totalAmount, customAmounts, participants) {
  const sum = participants.reduce((acc, uid) => acc + (parseFloat(customAmounts[uid]) || 0), 0);
  const diff = Math.abs(round2(sum) - round2(totalAmount));
  if (diff > 1) {
    return `Amounts sum to ₹${round2(sum)}, but total is ₹${totalAmount}. Difference: ₹${round2(diff)}.`;
  }
  return null;
}
