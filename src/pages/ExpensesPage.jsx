import React, {
  useState, useEffect, useMemo, useCallback,
} from 'react';
import {
  Receipt, Search, Filter, Plus, RefreshCw,
  TrendingUp, IndianRupee, CalendarDays, LayoutGrid,
} from 'lucide-react';
import { useGroups }      from '../hooks/useGroups';
import { useAllExpenses } from '../hooks/useAllExpenses';
import { useToast }       from '../hooks/useToast';
import { useAuth }        from '../hooks/useAuth';
import { deleteExpense }  from '../services/expenseService';
import ExpenseCard        from '../components/expenses/ExpenseCard';
import AddExpenseModal    from '../components/expenses/AddExpenseModal';
import Card               from '../components/common/Card';
import Button             from '../components/common/Button';
import { Select }         from '../components/common/Input';
import EmptyState         from '../components/common/EmptyState';
import LoadingSpinner     from '../components/common/LoadingSpinner';
import Badge              from '../components/common/Badge';
import { formatCurrency, round2 } from '../utils/formatters';
import { ALL_CATEGORIES } from '../utils/nlpParser';

// ── Date-range presets ────────────────────────────────────────────
const DATE_FILTERS = [
  { label: 'All time',   value: 'all'   },
  { label: 'This week',  value: 'week'  },
  { label: 'This month', value: 'month' },
  { label: 'Last 3 mo',  value: '3mo'  },
];

function isWithinRange(createdAt, range) {
  if (range === 'all' || !createdAt) return true;
  const d   = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
  const now = Date.now();
  const ms  = { week: 7, month: 30, '3mo': 90 }[range] * 86_400_000;
  return now - d.getTime() <= ms;
}

export default function ExpensesPage() {
  const { groups }                         = useGroups();
  const { user }                           = useAuth();
  const { toastSuccess, toastError }       = useToast();
  const {
    allExpenses, categoryTotals, loading,
    loadAllExpenses,
  } = useAllExpenses();

  const [showAdd,       setShowAdd]       = useState(false);
  const [addGroup,      setAddGroup]      = useState(null);   // which group to add to
  const [search,        setSearch]        = useState('');
  const [groupFilter,   setGroupFilter]   = useState('all');
  const [categoryFilter,setCategoryFilter] = useState('all');
  const [dateFilter,    setDateFilter]    = useState('all');
  const [showFilters,   setShowFilters]   = useState(false);

  // Load all expenses on mount / when groups change
  useEffect(() => {
    if (groups.length) loadAllExpenses(groups);
  }, [groups, loadAllExpenses]);

  // ── Active group object for AddExpenseModal ────────────────────
  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === addGroup) || groups[0] || null,
    [groups, addGroup]
  );

  // ── Filtered expenses (memoized) ──────────────────────────────
  const filtered = useMemo(() => {
    let list = allExpenses;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.description?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.groupName?.toLowerCase().includes(q)
      );
    }
    if (groupFilter    !== 'all') list = list.filter((e) => e.groupId === groupFilter);
    if (categoryFilter !== 'all') list = list.filter((e) => e.category === categoryFilter);
    list = list.filter((e) => isWithinRange(e.createdAt, dateFilter));
    return list;
  }, [allExpenses, search, groupFilter, categoryFilter, dateFilter]);

  // ── Aggregated stats for filtered view ────────────────────────
  const stats = useMemo(() => {
    const total    = filtered.reduce((s, e) => s + (e.amount || 0), 0);
    const youOwe   = filtered.reduce((s, e) => {
      const share = e.shares?.find((sh) => sh.uid === user?.uid);
      return e.payerId !== user?.uid ? s + (share?.owes || 0) : s;
    }, 0);
    const owedToYou = filtered.reduce((s, e) => {
      if (e.payerId !== user?.uid) return s;
      return s + e.shares?.reduce((ss, sh) => sh.uid !== user?.uid ? ss + (sh.owes || 0) : ss, 0);
    }, 0);
    return { total: round2(total), youOwe: round2(youOwe), owedToYou: round2(owedToYou) };
  }, [filtered, user]);

  const activeFilterCount = [
    groupFilter    !== 'all',
    categoryFilter !== 'all',
    dateFilter     !== 'all',
  ].filter(Boolean).length;

  const handleDelete = useCallback(async (expId, groupId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(groupId, expId);
      toastSuccess('Expense deleted.');
      loadAllExpenses(groups);
    } catch (err) {
      toastError(err.message);
    }
  }, [groups, loadAllExpenses, toastSuccess, toastError]);

  const handleAdded = useCallback(async () => {
    await loadAllExpenses(groups);
  }, [groups, loadAllExpenses]);

  return (
    <div className="space-y-6 animate-enter">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">All Expenses</h1>
          <p className="text-sm text-slate-500 mt-1">
            {allExpenses.length} expense{allExpenses.length !== 1 ? 's' : ''} across {groups.length} group{groups.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={RefreshCw} loading={loading} onClick={() => loadAllExpenses(groups)}>
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => { setAddGroup(groups[0]?.id); setShowAdd(true); }}
            disabled={groups.length === 0}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: IndianRupee, label: 'Total spent',  value: stats.total,    color: 'text-slate-900',    bg: 'bg-slate-50'    },
          { icon: TrendingUp,  label: 'You are owed', value: stats.owedToYou, color: 'text-success-600', bg: 'bg-success-50'  },
          { icon: CalendarDays,label: 'You owe',      value: stats.youOwe,   color: 'text-danger-600',   bg: 'bg-danger-50'   },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} padding="md" className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Search + filter bar ───────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search expenses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-slate-300 transition-all"
          />
        </div>

        {/* Filter toggle */}
        <Button
          variant={showFilters || activeFilterCount > 0 ? 'primary' : 'secondary'}
          size="sm"
          icon={Filter}
          onClick={() => setShowFilters((v) => !v)}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 w-5 h-5 rounded-full bg-white/30 text-xs font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Quick date tabs */}
        <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
          {DATE_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDateFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateFilter === value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Expandable filter panel ────────────────────────────────── */}
      {showFilters && (
        <Card padding="md" className="animate-fade-in">
          <div className="flex flex-wrap gap-4 items-end">
            <Select
              label="Group"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="min-w-[160px] flex-1"
            >
              <option value="all">All groups</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>

            <Select
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-w-[160px] flex-1"
            >
              <option value="all">All categories</option>
              {ALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>

            {(groupFilter !== 'all' || categoryFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setGroupFilter('all'); setCategoryFilter('all'); }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Category breakdown chips */}
          {categoryTotals.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Spending by category</p>
              <div className="flex flex-wrap gap-2">
                {categoryTotals.map(({ name, value }) => (
                  <button
                    key={name}
                    onClick={() => setCategoryFilter(categoryFilter === name ? 'all' : name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      categoryFilter === name
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                    }`}
                  >
                    {name}
                    <span className={`font-semibold ${categoryFilter === name ? 'text-white/80' : 'text-primary-600'}`}>
                      {formatCurrency(value)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Expense list ──────────────────────────────────────────── */}
      {loading && allExpenses.length === 0 ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="md" label="Loading expenses…" />
        </div>
      ) : filtered.length === 0 ? (
        search || activeFilterCount > 0 ? (
          <EmptyState
            icon={Search}
            title="No expenses match"
            message="Try adjusting your search or filters."
            action={
              <Button variant="ghost" onClick={() => { setSearch(''); setGroupFilter('all'); setCategoryFilter('all'); setDateFilter('all'); }}>
                Clear all filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            message="Add your first expense or create a group to get started."
            action={
              groups.length > 0 && (
                <Button variant="primary" icon={Plus} onClick={() => { setAddGroup(groups[0]?.id); setShowAdd(true); }}>
                  Add first expense
                </Button>
              )
            }
          />
        )
      ) : (
        <div className="space-y-3">
          {/* Result count */}
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> expense{filtered.length !== 1 ? 's' : ''}
            {activeFilterCount > 0 && ' (filtered)'}
          </p>

          {filtered.map((expense) => {
            const grp = groups.find((g) => g.id === expense.groupId);
            return (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                group={grp}
                onDelete={(expId) => handleDelete(expId, expense.groupId)}
                onUpdated={handleAdded}
              />
            );
          })}
        </div>
      )}

      {/* ── Add Expense modal ──────────────────────────────────────── */}
      {selectedGroup && (
        <AddExpenseModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          group={selectedGroup}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
