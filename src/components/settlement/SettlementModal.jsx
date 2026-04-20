import React, { useState, useCallback } from 'react';
import {
  CheckCircle, ArrowRight, Smartphone, CreditCard,
  Banknote, Wallet,
} from 'lucide-react';
import Modal   from '../common/Modal';
import Button  from '../common/Button';
import { Textarea } from '../common/Input';
import { formatCurrency } from '../../utils/formatters';
import { recordSettlement } from '../../services/settlementService';
import { useToast } from '../../hooks/useToast';
import { useAuth }  from '../../hooks/useAuth';
import Avatar from '../common/Avatar';

// Simulated payment methods
const PAYMENT_METHODS = [
  { id: 'upi',     label: 'UPI',        icon: Smartphone,  color: 'text-violet-600 bg-violet-50'  },
  { id: 'gpay',    label: 'Google Pay', icon: Wallet,      color: 'text-blue-600   bg-blue-50'    },
  { id: 'bank',    label: 'Bank Transfer', icon: CreditCard, color: 'text-slate-600 bg-slate-50' },
  { id: 'cash',    label: 'Cash',       icon: Banknote,    color: 'text-success-600 bg-success-50'},
];

/**
 * SettlementModal — confirm and simulate marking a debt as settled.
 *
 * Props:
 *   open     — controlled visibility
 *   onClose  — close callback
 *   debt     — { from, to, fromName, toName, amount, groupId, groupName }
 *   onSettled(settlement) — called with the recorded settlement doc
 */
export default function SettlementModal({ open, onClose, debt, onSettled }) {
  const { user }                     = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [method,    setMethod]    = useState('upi');
  const [note,      setNote]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [confirmed, setConfirmed] = useState(false);  // success state

  const isFromMe = debt?.from === user?.uid;

  const handleClose = useCallback(() => {
    setNote(''); setConfirmed(false); onClose();
  }, [onClose]);

  const handleSettle = useCallback(async () => {
    if (!debt) return;
    setLoading(true);
    try {
      const settlement = await recordSettlement({
        groupId:  debt.groupId,
        from:     debt.from,
        to:       debt.to,
        fromName: debt.fromName,
        toName:   debt.toName,
        amount:   debt.amount,
        note:     note || `Settled via ${PAYMENT_METHODS.find((m) => m.id === method)?.label}`,
      });

      setConfirmed(true);
      toastSuccess(`Settlement recorded! ${debt.fromName} → ${debt.toName} · ${formatCurrency(debt.amount)}`);

      // Let parent refresh after a short delay so user sees success state
      setTimeout(() => {
        onSettled?.(settlement);
        handleClose();
      }, 1800);
    } catch (err) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debt, method, note, onSettled, handleClose, toastSuccess, toastError]);

  if (!debt) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={confirmed ? 'Settlement recorded!' : 'Confirm settlement'}
      subtitle={confirmed ? 'Balances will update shortly' : `Simulated payment · no real money moves`}
      size="sm"
      footer={
        !confirmed && (
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button
              variant="success"
              icon={CheckCircle}
              loading={loading}
              onClick={handleSettle}
            >
              Confirm settled
            </Button>
          </div>
        )
      }
    >
      {confirmed ? (
        /* ── Success state ───────────────────────────────────── */
        <div className="text-center py-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-success-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mb-1">All settled up!</p>
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{debt.fromName}</span> has settled{' '}
            <span className="font-bold text-success-600">{formatCurrency(debt.amount)}</span>{' '}
            with <span className="font-semibold text-slate-700">{debt.toName}</span>.
          </p>
        </div>
      ) : (
        /* ── Confirmation form ───────────────────────────────── */
        <div className="space-y-5">
          {/* Summary pill */}
          <div className="flex items-center justify-center gap-3 bg-surface-50 rounded-2xl p-4">
            <div className="text-center">
              <Avatar name={debt.fromName} size="md" />
              <p className="text-xs font-semibold text-slate-700 mt-1.5 max-w-[70px] truncate">
                {isFromMe ? 'You' : debt.fromName}
              </p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(debt.amount)}</p>
              <div className="flex items-center gap-1 text-slate-400">
                <div className="h-px w-6 bg-slate-300" />
                <ArrowRight size={14} />
                <div className="h-px w-6 bg-slate-300" />
              </div>
            </div>

            <div className="text-center">
              <Avatar name={debt.toName} size="md" />
              <p className="text-xs font-semibold text-slate-700 mt-1.5 max-w-[70px] truncate">
                {debt.to === user?.uid ? 'You' : debt.toName}
              </p>
            </div>
          </div>

          {/* Group badge */}
          {debt.groupName && (
            <p className="text-xs text-center text-slate-500">
              Group: <span className="font-semibold text-primary-600">{debt.groupName}</span>
            </p>
          )}

          {/* Payment method selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Payment method <span className="text-slate-400 font-normal">(simulated)</span></p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setMethod(id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    method === id
                      ? 'border-primary-400 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Icon size={16} className={method === id ? 'text-primary-600' : color.split(' ')[0]} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional note */}
          <Textarea
            label="Note (optional)"
            placeholder="e.g. Sent via PhonePe"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />

          {/* Disclaimer */}
          <div className="bg-warning-50 border border-warning-200 rounded-xl px-4 py-3 text-xs text-warning-700 leading-relaxed">
            <strong>Demo mode:</strong> This records the settlement in Firestore but no real payment is processed.
            Both parties should confirm the actual transfer externally.
          </div>
        </div>
      )}
    </Modal>
  );
}
