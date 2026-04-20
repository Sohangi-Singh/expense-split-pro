import { useState, useCallback } from 'react';
import {
  fetchGroupExpenses,
  addExpense as svcAdd,
  updateExpense as svcUpdate,
  deleteExpense as svcDelete,
} from '../services/expenseService';

/**
 * useExpenses — manages expense CRUD state for a single group.
 * Fully implemented in Step 6; stub here so GroupDetailPage compiles.
 */
export function useExpenses(groupId) {
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const loadExpenses = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroupExpenses(groupId);
      setExpenses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const addExpense = useCallback(async (expenseData) => {
    const newExp = await svcAdd(groupId, expenseData);
    setExpenses((prev) => [newExp, ...prev]);
    return newExp;
  }, [groupId]);

  const updateExpense = useCallback(async (expId, updates) => {
    await svcUpdate(expId, updates);
    setExpenses((prev) => prev.map((e) => e.id === expId ? { ...e, ...updates } : e));
  }, []);

  const deleteExpense = useCallback(async (expId) => {
    await svcDelete(groupId, expId);
    setExpenses((prev) => prev.filter((e) => e.id !== expId));
  }, [groupId]);

  return { expenses, loading, error, loadExpenses, addExpense, updateExpense, deleteExpense };
}
