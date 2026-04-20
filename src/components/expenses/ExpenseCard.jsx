import React, { useState, useCallback } from 'react';
import { Receipt, Trash2, Pencil, User, ChevronDown, ChevronUp } from 'lucide-react';
import Card          from '../common/Card';
import Badge         from '../common/Badge';
import EditExpenseModal from './EditExpenseModal';
import { formatCurrency, timeAgo } from '../../utils/formatters';
import { useAuth }   from '../../hooks/useAuth';

const CATEGORY_COLORS = {
  'Food & Drinks': 'success',
  'Transport':     'info',
  'Entertainment': 'purple',
  'Shopping':      'warning',
  'Utilities':     'default',
  'Health':        'danger',
  'Travel':        'primary',
  'Other':         'default',
};

const CATEGORY_EMOJI = {
  'Food & Drinks': '🍽️',
  'Transport':     '🚗',
  'Entertainment': '🎬',
  'Shopping':      '🛍️',
  'Utilities':     '💡',
  'Health':        '💊',
  'Travel':        '✈️',
  'Other':         '📦',
};

export default function ExpenseCard({ expense, group, onDelete, onUpdated }) {
  const { user }                            = useAuth();
  const [expanded,    setExpanded]          = useState(false);
  const [showEdit,    setShowEdit]          = useState(false);

  const payerMember  = group?.members?.find((m) => m.uid === expense.payerId);
  const payerName    = payerMember?.name || expense.payerName || 'Unknown';
  const isMyExpense  = expense.payerId === user?.uid;

  const myShare      = expense.shares?.find((s) => s.uid === user?.uid);
  const myOwes       = myShare?.owes  || 0;
  const emoji        = CATEGORY_EMOJI[expense.category] || '📦';

  const handleEditDone = useCallback(async () => {
    await onUpdated?.();
  }, [onUpdated]);

  return (
    <>
      <Card hover padding="md" className="group">
        {/* ── Main row ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          {/* Left: icon + info */}
          <div
            className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            {/* Category emoji badge */}
            <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-lg shrink-0">
              {emoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{expense.description}</p>
                <Badge variant={CATEGORY_COLORS[expense.category] || 'default'} size="sm">
                  {expense.category || 'Other'}
                </Badge>
                <Badge variant={expense.splitType === 'equal' ? 'info' : 'purple'} size="sm">
                  {expense.splitType === 'equal' ? 'Equal' : 'Custom'} split
                </Badge>
                {expense.settled && (
                  <Badge variant="success" size="sm" dot>Settled</Badge>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <User size={11} />
                  <span>Paid by <span className="font-medium text-slate-600">{isMyExpense ? 'You' : payerName}</span></span>
                </div>
                <span>·</span>
                <span>{timeAgo(expense.createdAt)}</span>
                {group?.name && (
                  <>
                    <span>·</span>
                    <span className="text-primary-500 font-medium">{group.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: amount + action icons */}
          <div className="flex items-start gap-2 shrink-0">
            <div className="text-right">
              <p className="text-base font-bold text-slate-900">{formatCurrency(expense.amount)}</p>
              {myOwes > 0 && !isMyExpense && !expense.settled && (
                <p className="text-xs text-danger-600 font-medium">You owe {formatCurrency(myOwes)}</p>
              )}
              {isMyExpense && (expense.shares?.length || 0) > 1 && !expense.settled && (
                <p className="text-xs text-success-600 font-medium">You're owed</p>
              )}
              {expense.settled && (
                <p className="text-xs text-success-500 font-medium">✓ Settled</p>
              )}
            </div>

            {/* Action buttons — appear on hover */}
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowEdit(true)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-primary-500 hover:bg-primary-50 transition-all"
                title="Edit expense"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete?.(expense.id)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-danger-500 hover:bg-danger-50 transition-all"
                title="Delete expense"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all mt-0.5"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* ── Expanded: per-person breakdown ─────────────────────── */}
        {expanded && expense.shares && expense.shares.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Split breakdown</p>
            <div className="space-y-1.5">
              {expense.shares.map((share) => {
                const member  = group?.members?.find((m) => m.uid === share.uid);
                const name    = member?.name || share.uid;
                const isPayer = share.uid === expense.payerId;
                const isMe    = share.uid === user?.uid;

                return (
                  <div key={share.uid} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isPayer ? 'bg-success-500' : 'bg-danger-400'}`} />
                      <span className="text-slate-700">
                        {isMe ? 'You' : name}
                        {isPayer && <span className="ml-1.5 text-xs text-success-600 font-medium">(paid)</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-800">{formatCurrency(share.amount)}</span>
                      {share.owes > 0 && !isPayer && (
                        <span className="text-xs text-danger-500">owes {formatCurrency(share.owes)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Edit modal */}
      <EditExpenseModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        expense={expense}
        group={group}
        onUpdated={handleEditDone}
      />
    </>
  );
}
