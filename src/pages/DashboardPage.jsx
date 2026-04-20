import React, {
  useEffect, useMemo, useState, useCallback, useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Users, Sparkles, ArrowRight,
  SplitSquareVertical, Send,
} from 'lucide-react';

import { useAuth }        from '../hooks/useAuth';
import { useGroups }      from '../hooks/useGroups';
import { useAllExpenses } from '../hooks/useAllExpenses';
import { useToast }       from '../hooks/useToast';

import BalanceCard   from '../components/dashboard/BalanceCard';
import SpendingChart from '../components/dashboard/SpendingChart';
import ActivityFeed  from '../components/dashboard/ActivityFeed';
import Card          from '../components/common/Card';
import Button        from '../components/common/Button';
import Badge         from '../components/common/Badge';
import { AvatarGroup } from '../components/common/Avatar';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import LoadingSpinner  from '../components/common/LoadingSpinner';

import { formatCurrency, round2 } from '../utils/formatters';
import { computeGroupBalances }   from '../utils/debtSimplifier';
import { parseNLExpense, guessCategory } from '../utils/nlpParser';
import { addExpense } from '../services/expenseService';
import { calculateSplit } from '../utils/splitCalculator';

export default function DashboardPage() {
  const navigate  = useNavigate();
  const { user, profile } = useAuth();
  const { groups, loading: groupsLoading } = useGroups();
  const { toastSuccess, toastError, toastInfo } = useToast();

  const {
    allExpenses, categoryTotals, monthlyTotals,
    loading: expLoading, loadAllExpenses,
  } = useAllExpenses();

  // Modal states
  const [showAddExp,   setShowAddExp]   = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [addExpGroup,  setAddExpGroup]  = useState(null);

  // NLP quick-add bar
  const [nlInput,     setNlInput]     = useState('');
  const [nlParsed,    setNlParsed]    = useState(null);
  const [nlAdding,    setNlAdding]    = useState(false);
  const nlRef = useRef(null);

  // Load all expenses whenever groups change
  useEffect(() => {
    if (groups.length) loadAllExpenses(groups);
  }, [groups, loadAllExpenses]);

  // ── Aggregate balance across ALL groups ────────────────────────
  const overallBalance = useMemo(() => {
    if (!allExpenses.length || !user) {
      return { totalOwed: 0, totalOwes: 0, netBalance: 0 };
    }
    // Compute per-group then sum
    let totalOwed = 0, totalOwes = 0;
    for (const group of groups) {
      const groupExps = allExpenses.filter((e) => e.groupId === group.id);
      const bal = computeGroupBalances(groupExps, user.uid);
      totalOwed += bal.totalOwed;
      totalOwes += bal.totalOwes;
    }
    return {
      totalOwed:   round2(totalOwed),
      totalOwes:   round2(totalOwes),
      netBalance:  round2(totalOwed - totalOwes),
    };
  }, [allExpenses, groups, user]);

  // ── Quick-add via NLP ──────────────────────────────────────────
  const handleNLParse = useCallback(() => {
    const parsed = parseNLExpense(nlInput);
    if (!parsed || !parsed.amount) {
      toastError('Could not parse. Try: "Dinner 1200 split 4"');
      return;
    }
    if (parsed.description) parsed.category = guessCategory(parsed.description);
    setNlParsed(parsed);
    toastInfo(`Parsed: "${parsed.description}" · ₹${parsed.amount} · ${parsed.confidence} confidence`);
  }, [nlInput, toastError, toastInfo]);

  const handleNLQuickAdd = useCallback(async () => {
    if (!nlParsed || !groups.length) return;
    const targetGroup = groups[0];
    const members     = targetGroup.members || [];
    if (!members.length) { toastError('Selected group has no members.'); return; }

    setNlAdding(true);
    try {
      const amount  = nlParsed.amount;
      const count   = nlParsed.participants
        ? Math.min(nlParsed.participants, members.length)
        : members.length;
      const parts   = members.slice(0, count).map((m) => m.uid);
      const shares  = calculateSplit(amount, user.uid, parts, 'equal');

      await addExpense(targetGroup.id, {
        description: nlParsed.description || 'Unnamed expense',
        amount,
        payerId:     user.uid,
        payerName:   profile?.name || user.displayName || '',
        splitType:   'equal',
        participants: parts,
        shares,
        category:    nlParsed.category || 'Other',
        settled:     false,
      });

      toastSuccess(`Added "${nlParsed.description}" to ${targetGroup.name}!`);
      setNlInput(''); setNlParsed(null);
      await loadAllExpenses(groups);
    } catch (err) {
      toastError(err.message);
    } finally {
      setNlAdding(false);
    }
  }, [nlParsed, groups, user, profile, loadAllExpenses, toastSuccess, toastError]);

  const isLoading = groupsLoading || expLoading;

  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'there';
  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 animate-enter">

      {/* ── Greeting ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {greeting}, {displayName.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's your expense overview across {groups.length} group{groups.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={Users} onClick={() => setShowNewGroup(true)} size="sm">
            New Group
          </Button>
          <Button
            variant="primary" icon={Plus} size="sm"
            onClick={() => { setAddExpGroup(groups[0]); setShowAddExp(true); }}
            disabled={!groups.length}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* ── Balance hero cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BalanceCard variant="owed" amount={overallBalance.totalOwed}  groupCount={groups.length} />
        <BalanceCard variant="owes" amount={overallBalance.totalOwes}  groupCount={groups.length} />
        <BalanceCard variant="net"  amount={overallBalance.netBalance} groupCount={groups.length} />
      </div>

      {/* ── NLP quick-add bar ─────────────────────────────────────── */}
      <Card padding="md" className="border-2 border-dashed border-primary-200 bg-primary-50/30">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-primary-500" />
          <p className="text-sm font-semibold text-primary-700">Quick Add (Smart Input)</p>
          <Badge variant="primary" size="sm">AI-like</Badge>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={nlRef}
              type="text"
              value={nlInput}
              onChange={(e) => { setNlInput(e.target.value); setNlParsed(null); }}
              onKeyDown={(e) => e.key === 'Enter' && (nlParsed ? handleNLQuickAdd() : handleNLParse())}
              placeholder='Type like: "Dinner 1200 split 4" or "Cab 350"'
              className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-primary-200 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {!nlParsed ? (
            <Button variant="outline" onClick={handleNLParse} icon={Sparkles} size="md" className="shrink-0">
              Parse
            </Button>
          ) : (
            <Button
              variant="primary" onClick={handleNLQuickAdd}
              loading={nlAdding} icon={Send} size="md" className="shrink-0"
            >
              Add to {groups[0]?.name || 'group'}
            </Button>
          )}
        </div>

        {/* Parsed preview */}
        {nlParsed && (
          <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
            <span className="text-xs bg-white border border-primary-100 rounded-full px-3 py-1 text-slate-700">
              📝 <b>{nlParsed.description}</b>
            </span>
            <span className="text-xs bg-white border border-primary-100 rounded-full px-3 py-1 text-slate-700">
              💰 {formatCurrency(nlParsed.amount)}
            </span>
            {nlParsed.participants && (
              <span className="text-xs bg-white border border-primary-100 rounded-full px-3 py-1 text-slate-700">
                👥 {nlParsed.participants} people
              </span>
            )}
            <span className="text-xs bg-white border border-primary-100 rounded-full px-3 py-1 text-slate-700">
              🏷️ {nlParsed.category}
            </span>
            <Badge variant={nlParsed.confidence === 'high' ? 'success' : nlParsed.confidence === 'medium' ? 'warning' : 'default'} size="sm" dot>
              {nlParsed.confidence} confidence
            </Badge>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-2">
          Press Enter to parse, then Enter again to add to <b>{groups[0]?.name || 'your first group'}</b>
        </p>
      </Card>

      {/* ── Charts ────────────────────────────────────────────────── */}
      {isLoading && allExpenses.length === 0 ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner label="Loading your data…" />
        </div>
      ) : (
        <SpendingChart categoryData={categoryTotals} monthlyData={monthlyTotals} />
      )}

      {/* ── Bottom grid: groups + activity ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Groups summary (2/5 width on large) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="section-heading">Your Groups</p>
            <button
              onClick={() => navigate('/groups')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
            >
              See all <ArrowRight size={12} />
            </button>
          </div>

          {groups.length === 0 ? (
            <Card padding="md" className="text-center">
              <div className="py-4">
                <p className="text-sm text-slate-500 mb-3">No groups yet</p>
                <Button variant="primary" icon={Users} size="sm" onClick={() => setShowNewGroup(true)}>
                  Create first group
                </Button>
              </div>
            </Card>
          ) : (
            groups.slice(0, 4).map((g) => {
              const gExps  = allExpenses.filter((e) => e.groupId === g.id);
              const bal    = computeGroupBalances(gExps, user?.uid);
              const names  = (g.members || []).map((m) => m.name || m.email);

              return (
                <Card
                  key={g.id} hover padding="sm"
                  onClick={() => navigate(`/groups/${g.id}`)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarGroup names={names} max={3} size="xs" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{g.name}</p>
                        <p className="text-xs text-slate-400">{g.members?.length} members</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {bal.netBalance > 0 && (
                        <p className="text-xs font-bold text-success-600">+{formatCurrency(bal.netBalance)}</p>
                      )}
                      {bal.netBalance < 0 && (
                        <p className="text-xs font-bold text-danger-600">{formatCurrency(bal.netBalance)}</p>
                      )}
                      {bal.netBalance === 0 && (
                        <p className="text-xs text-slate-400">settled</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Activity feed (3/5 width on large) */}
        <div className="lg:col-span-3">
          <ActivityFeed expenses={allExpenses} groups={groups} limit={8} />
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────── */}
      <CreateGroupModal
        open={showNewGroup}
        onClose={() => setShowNewGroup(false)}
      />
      {addExpGroup && (
        <AddExpenseModal
          open={showAddExp}
          onClose={() => setShowAddExp(false)}
          group={addExpGroup}
          onAdded={() => loadAllExpenses(groups)}
        />
      )}
    </div>
  );
}
