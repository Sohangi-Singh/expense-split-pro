import React, {
  useState, useEffect, useMemo, useCallback,
} from 'react';
import {
  ArrowLeftRight, CheckCircle, Clock, RefreshCw,
  TrendingDown, TrendingUp, Users, History,
} from 'lucide-react';

import { useAuth }        from '../hooks/useAuth';
import { useGroups }      from '../hooks/useGroups';
import { useAllExpenses } from '../hooks/useAllExpenses';
import { useToast }       from '../hooks/useToast';

import DebtCard        from '../components/settlement/DebtCard';
import SettlementModal from '../components/settlement/SettlementModal';
import Card            from '../components/common/Card';
import Badge           from '../components/common/Badge';
import Button          from '../components/common/Button';
import EmptyState      from '../components/common/EmptyState';
import LoadingSpinner  from '../components/common/LoadingSpinner';
import Avatar          from '../components/common/Avatar';

import { formatCurrency, timeAgo, round2 } from '../utils/formatters';
import { simplifyDebts, computeGroupBalances } from '../utils/debtSimplifier';
import {
  fetchAllSettlements,
  buildSettledMap,
} from '../services/settlementService';

// ── Settlement history row ─────────────────────────────────────────
function SettlementRow({ s, currentUserId }) {
  const isFromMe = s.from === currentUserId;
  const isToMe   = s.to   === currentUserId;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center shrink-0">
        <CheckCircle size={14} className="text-success-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">
          <span className={isFromMe ? 'text-danger-600 font-semibold' : ''}>
            {isFromMe ? 'You' : s.fromName}
          </span>
          {' '}paid{' '}
          <span className={isToMe ? 'text-success-600 font-semibold' : ''}>
            {isToMe ? 'you' : s.toName}
          </span>
        </p>
        {s.note && <p className="text-xs text-slate-400 truncate">{s.note}</p>}
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-success-700">{formatCurrency(s.amount)}</p>
        <p className="text-[11px] text-slate-400">{timeAgo(s.settledAt)}</p>
      </div>
    </div>
  );
}

export default function SettlementsPage() {
  const { user }   = useAuth();
  const { groups } = useGroups();
  const { toastError } = useToast();

  const {
    allExpenses, loading: expLoading, loadAllExpenses,
  } = useAllExpenses();

  const [settlements,     setSettlements]     = useState([]);
  const [settleLoading,   setSettleLoading]   = useState(false);
  const [refreshing,      setRefreshing]      = useState(false);
  const [activeDebt,      setActiveDebt]      = useState(null);   // debt being settled
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [activeTab,       setActiveTab]       = useState('outstanding'); // 'outstanding' | 'history'
  const [groupFilter,     setGroupFilter]     = useState('all');

  // ── Load data ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!groups.length) return;
    setRefreshing(true);
    try {
      await loadAllExpenses(groups);
      const groupIds = groups.map((g) => g.id);
      const data     = await fetchAllSettlements(groupIds);
      setSettlements(data);
    } catch (err) {
      toastError('Failed to load settlements.');
    } finally {
      setRefreshing(false);
    }
  }, [groups, loadAllExpenses, toastError]);

  useEffect(() => { loadData(); }, [groups.length]); // eslint-disable-line

  // ── Build name map (uid → display name) ───────────────────────
  const nameMap = useMemo(() => {
    const map = {};
    for (const g of groups) {
      for (const m of (g.members || [])) {
        map[m.uid] = m.name || m.email;
      }
    }
    return map;
  }, [groups]);

  // ── Build settled amounts map ──────────────────────────────────
  const settledMap = useMemo(() => buildSettledMap(settlements), [settlements]);

  // ── Compute simplified debts per group, then merge ────────────
  const allDebts = useMemo(() => {
    const debts = [];
    const targetGroups = groupFilter === 'all'
      ? groups
      : groups.filter((g) => g.id === groupFilter);

    for (const group of targetGroups) {
      const gExps = allExpenses.filter((e) => e.groupId === group.id);
      if (!gExps.length) continue;

      const rawDebts = [];
      for (const exp of gExps) {
        for (const share of (exp.shares || [])) {
          if (share.owes > 0 && share.uid !== exp.payerId) {
            rawDebts.push({ from: share.uid, to: exp.payerId, amount: share.owes });
          }
        }
      }

      const simplified = simplifyDebts(rawDebts, nameMap);
      simplified.forEach((d) => debts.push({ ...d, groupId: group.id, groupName: group.name }));
    }
    return debts;
  }, [allExpenses, groups, nameMap, groupFilter]);

  // ── Separate outstanding vs. settled ──────────────────────────
  const { outstanding, settled: fullySettled } = useMemo(() => {
    const outstanding = [];
    const settled     = [];

    for (const debt of allDebts) {
      const key        = `${debt.from}→${debt.to}`;
      const paidSoFar  = settledMap[key] || 0;
      const remaining  = round2(debt.amount - paidSoFar);

      if (remaining <= 0.01) {
        settled.push({ ...debt, partialPaid: debt.amount });
      } else {
        outstanding.push({ ...debt, partialPaid: paidSoFar, remaining });
      }
    }
    return { outstanding, settled };
  }, [allDebts, settledMap]);

  // ── My personal summary ────────────────────────────────────────
  const mySummary = useMemo(() => {
    const iOwe    = outstanding.filter((d) => d.from === user?.uid).reduce((s, d) => s + d.remaining, 0);
    const owedMe  = outstanding.filter((d) => d.to   === user?.uid).reduce((s, d) => s + d.remaining, 0);
    const myHist  = settlements.filter((s) => s.from === user?.uid || s.to === user?.uid).length;
    return { iOwe: round2(iOwe), owedMe: round2(owedMe), histCount: myHist };
  }, [outstanding, settlements, user]);

  const handleSettleClick = useCallback((debt) => {
    setActiveDebt(debt);
    setShowSettleModal(true);
  }, []);

  const handleSettled = useCallback(async (newSettlement) => {
    setSettlements((prev) => [newSettlement, ...prev]);
    // Reload full data to reflect updated balances
    loadData();
  }, [loadData]);

  const isLoading = expLoading || refreshing;

  return (
    <div className="space-y-6 animate-enter">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Settlements</h1>
          <p className="text-sm text-slate-500 mt-1">
            Settle up debts and track payment history
          </p>
        </div>
        <Button
          variant="ghost" size="sm" icon={RefreshCw}
          loading={refreshing} onClick={loadData}
        >
          Refresh
        </Button>
      </div>

      {/* ── Personal summary cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="border-l-4 border-l-danger-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
              <TrendingDown size={18} className="text-danger-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">You owe in total</p>
              <p className="text-xl font-extrabold text-danger-700">{formatCurrency(mySummary.iOwe)}</p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-success-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-success-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Owed to you</p>
              <p className="text-xl font-extrabold text-success-700">{formatCurrency(mySummary.owedMe)}</p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-primary-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <History size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">My settlements</p>
              <p className="text-xl font-extrabold text-primary-700">{mySummary.histCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Group filter ──────────────────────────────────────────── */}
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGroupFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              groupFilter === 'all'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
            }`}
          >
            All groups
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setGroupFilter(g.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                groupFilter === g.id
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit">
        {[
          { key: 'outstanding', label: `Outstanding (${outstanding.length})`, icon: ArrowLeftRight },
          { key: 'history',     label: `History (${settlements.length})`,      icon: History        },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── Outstanding debts ─────────────────────────────────────── */}
      {activeTab === 'outstanding' && (
        <div className="space-y-4">
          {isLoading && outstanding.length === 0 ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner label="Computing debts…" />
            </div>
          ) : outstanding.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="All settled up! 🎉"
              message="There are no outstanding debts in your groups."
            />
          ) : (
            <>
              {/* My debts first */}
              {outstanding.some((d) => d.from === user?.uid || d.to === user?.uid) && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                    <Users size={15} className="text-primary-500" /> Involving you
                  </p>
                  {outstanding
                    .filter((d) => d.from === user?.uid || d.to === user?.uid)
                    .map((debt, i) => (
                      <DebtCard
                        key={`me-${i}`}
                        debt={debt}
                        partialPaid={debt.partialPaid}
                        onSettle={handleSettleClick}
                      />
                    ))}
                </div>
              )}

              {/* Other group debts */}
              {outstanding.some((d) => d.from !== user?.uid && d.to !== user?.uid) && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600">Other group debts</p>
                  {outstanding
                    .filter((d) => d.from !== user?.uid && d.to !== user?.uid)
                    .map((debt, i) => (
                      <DebtCard
                        key={`other-${i}`}
                        debt={debt}
                        partialPaid={debt.partialPaid}
                        onSettle={handleSettleClick}
                      />
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Settlement history ─────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {settlements.length === 0 ? (
            <EmptyState
              icon={History}
              title="No settlements yet"
              message="Once you mark debts as settled, the history appears here."
              compact
            />
          ) : (
            <Card padding="sm">
              {settlements.map((s, i) => (
                <React.Fragment key={s.id || i}>
                  <SettlementRow s={s} currentUserId={user?.uid} />
                  {i < settlements.length - 1 && <hr className="border-slate-100 mx-3" />}
                </React.Fragment>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ── Settlement modal ──────────────────────────────────────── */}
      <SettlementModal
        open={showSettleModal}
        onClose={() => { setShowSettleModal(false); setActiveDebt(null); }}
        debt={activeDebt}
        onSettled={handleSettled}
      />
    </div>
  );
}
