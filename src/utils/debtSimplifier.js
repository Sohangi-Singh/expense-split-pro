import { round2 } from './formatters';

/**
 * simplifyDebts — minimizes the number of transactions needed to settle all debts.
 *
 * Algorithm:
 *   1. Compute net balance for each person (positive = owed money, negative = owes money).
 *   2. Greedily match the largest creditor with the largest debtor.
 *   3. Repeat until all balances are zero.
 *
 * @param {Object[]} rawDebts  — [{ from: uid, to: uid, amount: number }]
 * @param {Object}   nameMap   — { [uid]: displayName } for readable output
 *
 * @returns {Object[]} transactions — [{ from, to, amount, fromName, toName }]
 */
export function simplifyDebts(rawDebts, nameMap = {}) {
  // Step 1: aggregate net balances
  const balance = {};

  for (const { from, to, amount } of rawDebts) {
    balance[from] = round2((balance[from] || 0) - amount);
    balance[to]   = round2((balance[to]   || 0) + amount);
  }

  // Separate into creditors (net > 0) and debtors (net < 0)
  const creditors = Object.entries(balance)
    .filter(([, v]) => v > 0.001)
    .map(([uid, amt]) => ({ uid, amt }))
    .sort((a, b) => b.amt - a.amt);

  const debtors = Object.entries(balance)
    .filter(([, v]) => v < -0.001)
    .map(([uid, amt]) => ({ uid, amt: -amt }))   // make positive
    .sort((a, b) => b.amt - a.amt);

  const transactions = [];
  let ci = 0, di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor   = debtors[di];
    const transfer = round2(Math.min(creditor.amt, debtor.amt));

    if (transfer > 0.001) {
      transactions.push({
        from:     debtor.uid,
        to:       creditor.uid,
        amount:   transfer,
        fromName: nameMap[debtor.uid]   || debtor.uid,
        toName:   nameMap[creditor.uid] || creditor.uid,
      });
    }

    creditor.amt = round2(creditor.amt - transfer);
    debtor.amt   = round2(debtor.amt   - transfer);

    if (creditor.amt < 0.001) ci++;
    if (debtor.amt   < 0.001) di++;
  }

  return transactions;
}

/**
 * computeGroupBalances — returns each member's net balance within a group.
 *
 * @param {Object[]} expenses — Firestore expense docs for the group
 * @param {string}   currentUserId
 *
 * @returns {Object} { totalOwed, totalOwes, netBalance, perPerson: [{uid, name, amount}] }
 */
export function computeGroupBalances(expenses = [], currentUserId) {
  const balance = {};

  for (const exp of expenses) {
    if (!exp.shares) continue;
    for (const share of exp.shares) {
      if (share.uid === exp.payerId) continue;
      if (share.owes <= 0) continue;

      // The payer is owed money by share.uid
      balance[exp.payerId] = round2((balance[exp.payerId] || 0) + share.owes);
      balance[share.uid]   = round2((balance[share.uid]   || 0) - share.owes);
    }
  }

  const myBalance   = balance[currentUserId] || 0;
  const totalOwed   = myBalance > 0 ? myBalance : 0;   // others owe me
  const totalOwes   = myBalance < 0 ? -myBalance : 0;  // I owe others

  return {
    totalOwed,
    totalOwes,
    netBalance: myBalance,
    perPerson:  Object.entries(balance).map(([uid, amount]) => ({ uid, amount })),
  };
}
