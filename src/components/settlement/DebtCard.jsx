import React from 'react';
import { ArrowRight, CheckCircle, Clock } from 'lucide-react';
import Card   from '../common/Card';
import Badge  from '../common/Badge';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { formatCurrency, round2 } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';

/**
 * DebtCard — displays a single simplified debt: "A pays B ₹X"
 *
 * Props:
 *   debt         — { from, to, fromName, toName, amount, groupId, groupName }
 *   onSettle     — callback(debt) — opens SettlementModal
 *   partialPaid  — amount already settled for this pair (subtracted from display)
 *   settled      — true when fully settled (shows settled state)
 */
export default function DebtCard({ debt, onSettle, partialPaid = 0, settled = false }) {
  const { user } = useAuth();

  const remaining   = round2(debt.amount - partialPaid);
  const isFromMe    = debt.from === user?.uid;
  const isToMe      = debt.to   === user?.uid;
  const isMeInvolved = isFromMe || isToMe;

  return (
    <Card
      padding="md"
      className={`transition-all ${settled ? 'opacity-60' : ''} ${isMeInvolved ? 'border-l-4 border-l-primary-400' : ''}`}
    >
      <div className="flex items-center gap-4 flex-wrap">

        {/* ── Payer (from) ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={debt.fromName} size="sm" />
          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate ${isFromMe ? 'text-danger-600' : 'text-slate-800'}`}>
              {isFromMe ? 'You' : debt.fromName}
            </p>
            <p className="text-xs text-slate-400">pays</p>
          </div>
        </div>

        {/* ── Arrow + amount ───────────────────────────────────── */}
        <div className="flex flex-col items-center flex-1 min-w-[80px]">
          <p className="text-xl font-extrabold text-slate-900 leading-tight">
            {formatCurrency(remaining)}
          </p>
          {partialPaid > 0 && (
            <p className="text-[10px] text-slate-400 line-through">{formatCurrency(debt.amount)}</p>
          )}
          <div className="flex items-center gap-1 mt-0.5">
            <div className="h-px w-8 bg-slate-200" />
            <ArrowRight size={14} className="text-slate-400" />
            <div className="h-px w-8 bg-slate-200" />
          </div>
        </div>

        {/* ── Receiver (to) ────────────────────────────────────── */}
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={debt.toName} size="sm" />
          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate ${isToMe ? 'text-success-600' : 'text-slate-800'}`}>
              {isToMe ? 'You' : debt.toName}
            </p>
            <p className="text-xs text-slate-400">receives</p>
          </div>
        </div>

        {/* ── Group + action ───────────────────────────────────── */}
        <div className="flex items-center gap-3 ml-auto shrink-0 flex-wrap">
          {debt.groupName && (
            <Badge variant="primary" size="sm">{debt.groupName}</Badge>
          )}

          {settled ? (
            <div className="flex items-center gap-1.5 text-success-600 text-sm font-semibold">
              <CheckCircle size={16} />
              Settled
            </div>
          ) : (
            <Button
              variant={isFromMe ? 'primary' : 'secondary'}
              size="sm"
              icon={isFromMe ? CheckCircle : Clock}
              onClick={() => onSettle?.(debt)}
              disabled={remaining <= 0}
            >
              {isFromMe ? 'Mark settled' : 'Remind'}
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar for partial payment */}
      {partialPaid > 0 && !settled && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Settled so far</span>
            <span>{formatCurrency(partialPaid)} / {formatCurrency(debt.amount)}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-success-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((partialPaid / debt.amount) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
