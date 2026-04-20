import React, { useMemo } from 'react';
import { SplitSquareVertical, User } from 'lucide-react';
import { formatCurrency, round2 } from '../../utils/formatters';
import { calculateSplit } from '../../utils/splitCalculator';
import Avatar from '../common/Avatar';

/**
 * SplitCalculator — visual breakdown of how an expense is split.
 *
 * Props:
 *   amount        — total amount
 *   payerId       — uid of payer
 *   participants  — [uid, ...]
 *   splitType     — 'equal' | 'unequal'
 *   customAmounts — { [uid]: number }
 *   members       — [{ uid, name, email }]
 *   showOwes      — if true shows "owes" vs "paid"
 */
export default function SplitCalculator({
  amount,
  payerId,
  participants = [],
  splitType    = 'equal',
  customAmounts = {},
  members      = [],
  showOwes     = true,
}) {
  const shares = useMemo(() => {
    const amt = parseFloat(amount);
    if (!amt || participants.length === 0) return [];
    return calculateSplit(amt, payerId, participants, splitType, customAmounts);
  }, [amount, payerId, participants, splitType, customAmounts]);

  const total = parseFloat(amount) || 0;

  if (shares.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
        <SplitSquareVertical size={16} />
        Enter an amount and select participants to see the split
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
        <span>Member</span>
        <div className="flex gap-6">
          <span>Share</span>
          {showOwes && <span className="w-14 text-right">Owes</span>}
        </div>
      </div>

      {/* Rows */}
      {shares.map((share) => {
        const member     = members.find((m) => m.uid === share.uid);
        const name       = member?.name || member?.email || share.uid;
        const isPayer    = share.uid === payerId;
        const pct        = total > 0 ? round2((share.amount / total) * 100) : 0;

        return (
          <div key={share.uid} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-50 border border-surface-200">
            {/* Avatar + name */}
            <Avatar name={name} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-slate-700 truncate">{name}</p>
                {isPayer && (
                  <span className="text-xs bg-success-100 text-success-700 px-1.5 py-0.5 rounded-full font-medium">
                    Paid
                  </span>
                )}
              </div>
              {/* Progress bar */}
              <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden w-full max-w-[120px]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isPayer ? 'bg-success-500' : 'bg-primary-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Amount + owes */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">{formatCurrency(share.amount)}</p>
                <p className="text-xs text-slate-400">{pct}%</p>
              </div>
              {showOwes && (
                <div className="w-14 text-right">
                  {share.owes > 0 ? (
                    <span className="text-xs font-semibold text-danger-600">{formatCurrency(share.owes)}</span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Summary footer */}
      <div className="flex items-center justify-between pt-2 px-1 border-t border-slate-100">
        <span className="text-xs text-slate-500 font-medium">Total</span>
        <span className="text-sm font-bold text-slate-900">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
