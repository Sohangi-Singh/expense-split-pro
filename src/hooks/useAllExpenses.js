import { useState, useCallback, useMemo } from 'react';
import { fetchGroupExpenses } from '../services/expenseService';

/**
 * useAllExpenses — fetches and aggregates expenses from ALL groups the user belongs to.
 *
 * Each expense is augmented with its groupId and groupName for display.
 * Heavy computation (totals, category breakdown) is memoized.
 */
export function useAllExpenses() {
  const [expensesByGroup, setExpensesByGroup] = useState({});  // { [groupId]: expense[] }
  const [loading, setLoading]                  = useState(false);
  const [error,   setError]                    = useState(null);

  // Fetch all expenses for every group in the provided list
  const loadAllExpenses = useCallback(async (groups = []) => {
    if (!groups.length) { setExpensesByGroup({}); return; }
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        groups.map(async (g) => {
          const exps = await fetchGroupExpenses(g.id);
          // Tag each expense with group meta for cross-group display
          return exps.map((e) => ({ ...e, groupName: g.name, groupId: g.id }));
        })
      );
      const byGroup = {};
      groups.forEach((g, i) => { byGroup[g.id] = results[i]; });
      setExpensesByGroup(byGroup);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Flat sorted list of all expenses (newest first)
  const allExpenses = useMemo(() => {
    const flat = Object.values(expensesByGroup).flat();
    return flat.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    });
  }, [expensesByGroup]);

  // Category totals for the spending chart
  const categoryTotals = useMemo(() => {
    const totals = {};
    for (const exp of allExpenses) {
      const cat = exp.category || 'Other';
      totals[cat] = (totals[cat] || 0) + (exp.amount || 0);
    }
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allExpenses]);

  // Monthly totals for the line/bar chart (last 6 months)
  const monthlyTotals = useMemo(() => {
    const now     = new Date();
    const months  = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        year:  d.getFullYear(),
        month: d.getMonth(),
        total: 0,
      });
    }

    for (const exp of allExpenses) {
      const d = exp.createdAt?.toDate ? exp.createdAt.toDate() : new Date(exp.createdAt || 0);
      const m = months.find((mo) => mo.year === d.getFullYear() && mo.month === d.getMonth());
      if (m) m.total += exp.amount || 0;
    }

    return months.map(({ label, total }) => ({ name: label, amount: Math.round(total) }));
  }, [allExpenses]);

  return {
    allExpenses,
    expensesByGroup,
    categoryTotals,
    monthlyTotals,
    loading,
    error,
    loadAllExpenses,
  };
}
