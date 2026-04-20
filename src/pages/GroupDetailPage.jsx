import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Receipt, ArrowLeftRight,
  TrendingUp, TrendingDown, Minus, Copy, RefreshCw,
} from 'lucide-react';
import { useGroups }  from '../hooks/useGroups';
import { useAuth }    from '../hooks/useAuth';
import { useToast }   from '../hooks/useToast';
import { useExpenses } from '../hooks/useExpenses';
import Card           from '../components/common/Card';
import Button         from '../components/common/Button';
import Badge          from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState     from '../components/common/EmptyState';
import GroupMembersList from '../components/groups/GroupMembersList';
import ExpenseCard      from '../components/expenses/ExpenseCard';
import AddExpenseModal  from '../components/expenses/AddExpenseModal';
import { formatCurrency, timeAgo } from '../utils/formatters';
import { computeGroupBalances, simplifyDebts } from '../utils/debtSimplifier';

const TABS = ['Expenses', 'Balances', 'Members'];

export default function GroupDetailPage() {
  const { groupId }  = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { toastSuccess, toastError } = useToast();
  const { loadGroup, activeGroup, refreshActiveGroup } = useGroups();
  const { expenses, loading: expLoading, loadExpenses, deleteExpense } = useExpenses(groupId);

  const [activeTab,     setActiveTab]     = useState('Expenses');
  const [showAddExp,    setShowAddExp]    = useState(false);
  const [groupLoading,  setGroupLoading]  = useState(true);

  // Load group + expenses on mount
  useEffect(() => {
    (async () => {
      setGroupLoading(true);
      await loadGroup(groupId);
      await loadExpenses();
      setGroupLoading(false);
    })();
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  const group = activeGroup?.id === groupId ? activeGroup : null;

  // ── Balances (memoized — potentially expensive) ────────────────
  const balances = useMemo(() => {
    if (!expenses.length || !user) return { totalOwed: 0, totalOwes: 0, netBalance: 0, perPerson: [] };
    return computeGroupBalances(expenses, user.uid);
  }, [expenses, user]);

  // ── Simplified debts ───────────────────────────────────────────
  const simplifiedDebts = useMemo(() => {
    if (!expenses.length || !group) return [];
    const nameMap = Object.fromEntries((group.members || []).map((m) => [m.uid, m.name || m.email]));
    const rawDebts = [];
    for (const exp of expenses) {
      for (const share of (exp.shares || [])) {
        if (share.owes > 0 && share.uid !== exp.payerId) {
          rawDebts.push({ from: share.uid, to: exp.payerId, amount: share.owes });
        }
      }
    }
    return simplifyDebts(rawDebts, nameMap);
  }, [expenses, group]);

  const handleDeleteExpense = useCallback(async (expId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(expId);
      toastSuccess('Expense deleted.');
    } catch (err) {
      toastError(err.message);
    }
  }, [deleteExpense, toastSuccess, toastError]);

  const handleMembersChanged = useCallback(async () => {
    await loadGroup(groupId);
  }, [loadGroup, groupId]);

  if (groupLoading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" label="Loading group…" /></div>;
  if (!group)       return (
    <div className="text-center py-24">
      <p className="text-slate-500 mb-4">Group not found or you don't have access.</p>
      <Button variant="primary" onClick={() => navigate('/groups')}>Back to Groups</Button>
    </div>
  );

  const memberNames = (group.members || []).map((m) => m.name || m.email);
  const myBalance   = balances.netBalance;

  return (
    <div className="space-y-6 animate-enter">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4 flex-wrap">
        <button onClick={() => navigate('/groups')} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors shrink-0 mt-0.5">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title truncate">{group.name}</h1>
            <Badge variant="primary">{group.category}</Badge>
          </div>
          {group.description && <p className="text-sm text-slate-500 mt-0.5">{group.description}</p>}
          <p className="text-xs text-slate-400 mt-1">
            {group.members?.length} members · Created {timeAgo(group.createdAt)}
          </p>
        </div>
        <Button variant="primary" icon={Receipt} onClick={() => setShowAddExp(true)}>
          Add Expense
        </Button>
      </div>

      {/* ── Balance summary cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="border-l-4 border-l-success-500">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-success-500" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">You are owed</p>
          </div>
          <p className="text-2xl font-bold text-success-600">{formatCurrency(balances.totalOwed)}</p>
        </Card>

        <Card padding="md" className="border-l-4 border-l-danger-500">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={16} className="text-danger-500" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">You owe</p>
          </div>
          <p className="text-2xl font-bold text-danger-600">{formatCurrency(balances.totalOwes)}</p>
        </Card>

        <Card padding="md" className={`border-l-4 ${myBalance >= 0 ? 'border-l-primary-500' : 'border-l-warning-500'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Minus size={16} className="text-slate-400" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Net balance</p>
          </div>
          <p className={`text-2xl font-bold ${myBalance > 0 ? 'text-success-600' : myBalance < 0 ? 'text-danger-600' : 'text-slate-700'}`}>
            {myBalance >= 0 ? '+' : ''}{formatCurrency(myBalance)}
          </p>
        </Card>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab: Expenses ─────────────────────────────────────────── */}
      {activeTab === 'Expenses' && (
        <div className="space-y-3">
          {expLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner label="Loading expenses…" /></div>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              message="Add the first expense to start tracking what everyone owes."
              action={<Button variant="primary" icon={Receipt} onClick={() => setShowAddExp(true)}>Add Expense</Button>}
            />
          ) : (
            expenses.map((exp) => (
              <ExpenseCard
                key={exp.id}
                expense={exp}
                group={group}
                onDelete={handleDeleteExpense}
              />
            ))
          )}
        </div>
      )}

      {/* ── Tab: Balances ─────────────────────────────────────────── */}
      {activeTab === 'Balances' && (
        <div className="space-y-4">
          {simplifiedDebts.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="All settled up!"
              message="No outstanding debts in this group."
              compact
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-600">
                Simplified settlements — {simplifiedDebts.length} transaction{simplifiedDebts.length !== 1 ? 's' : ''} needed
              </p>
              {simplifiedDebts.map((debt, i) => (
                <Card key={i} padding="md" className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-danger-50 flex items-center justify-center shrink-0">
                      <TrendingDown size={16} className="text-danger-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        <span className="text-danger-600">{debt.fromName}</span>
                        {' '}<span className="text-slate-400 font-normal">pays</span>{' '}
                        <span className="text-success-600">{debt.toName}</span>
                      </p>
                      <p className="text-xs text-slate-400">Simplified debt</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-slate-900 shrink-0">{formatCurrency(debt.amount)}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Members ──────────────────────────────────────────── */}
      {activeTab === 'Members' && (
        <Card padding="md">
          <Card.Header title="Group Members" subtitle={`${group.members?.length} member${group.members?.length !== 1 ? 's' : ''}`} />
          <GroupMembersList group={group} onMembersChanged={handleMembersChanged} />
        </Card>
      )}

      {/* ── Add Expense modal ──────────────────────────────────────── */}
      <AddExpenseModal
        open={showAddExp}
        onClose={() => setShowAddExp(false)}
        group={group}
        onAdded={async () => { await loadExpenses(); await refreshActiveGroup(); }}
      />
    </div>
  );
}
