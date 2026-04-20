import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  DollarSign, FileText, User, Tag, SplitSquareVertical,
} from 'lucide-react';
import Modal             from '../common/Modal';
import Button            from '../common/Button';
import Input, { Select } from '../common/Input';
import SplitCalculator   from './SplitCalculator';
import { useAuth }       from '../../hooks/useAuth';
import { useToast }      from '../../hooks/useToast';
import { updateExpense } from '../../services/expenseService';
import { calculateSplit, validateUnequalSplit } from '../../utils/splitCalculator';
import { ALL_CATEGORIES } from '../../utils/nlpParser';
import { round2 } from '../../utils/formatters';

export default function EditExpenseModal({ open, onClose, expense, group, onUpdated }) {
  const { user }                     = useAuth();
  const { toastSuccess, toastError } = useToast();

  // Pre-fill from existing expense
  const [description,   setDescription]   = useState('');
  const [amount,        setAmount]         = useState('');
  const [payerId,       setPayerId]        = useState('');
  const [splitType,     setSplitType]      = useState('equal');
  const [participants,  setParticipants]   = useState([]);
  const [customAmounts, setCustomAmounts]  = useState({});
  const [category,      setCategory]       = useState('Other');
  const [errors,        setErrors]         = useState({});
  const [loading,       setLoading]        = useState(false);
  const [showPreview,   setShowPreview]    = useState(false);

  // Sync form when expense changes
  useEffect(() => {
    if (!expense || !open) return;
    setDescription(expense.description || '');
    setAmount(String(expense.amount || ''));
    setPayerId(expense.payerId || user?.uid || '');
    setSplitType(expense.splitType || 'equal');
    setParticipants(expense.participants || []);
    setCategory(expense.category || 'Other');
    // Restore custom amounts from existing shares
    if (expense.splitType === 'unequal' && expense.shares) {
      const ca = {};
      expense.shares.forEach((s) => { ca[s.uid] = s.amount; });
      setCustomAmounts(ca);
    } else {
      setCustomAmounts({});
    }
    setErrors({});
  }, [expense, open, user]);

  const handleClose = useCallback(() => { setErrors({}); onClose(); }, [onClose]);

  const toggleParticipant = useCallback((uid) => {
    setParticipants((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }, []);

  const handleCustomAmount = useCallback((uid, val) => {
    setCustomAmounts((prev) => ({ ...prev, [uid]: val }));
  }, []);

  // Live split preview
  const splitPreview = useMemo(() => {
    const amt = parseFloat(amount);
    if (!amt || !participants.length) return [];
    return calculateSplit(amt, payerId, participants, splitType, customAmounts);
  }, [amount, payerId, participants, splitType, customAmounts]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = {};
    if (!description.trim())     errs.description  = 'Description is required.';
    const amt = parseFloat(amount);
    if (!amt || amt <= 0)        errs.amount       = 'Enter a valid amount.';
    if (participants.length < 1) errs.participants = 'Select at least 1 participant.';

    if (splitType === 'unequal') {
      const ve = validateUnequalSplit(amt, customAmounts, participants);
      if (ve) errs.custom = ve;
    }

    if (Object.keys(errs).length) { setErrors(errs); return; }

    const shares      = calculateSplit(amt, payerId, participants, splitType, customAmounts);
    const payerMember = group?.members?.find((m) => m.uid === payerId);

    setLoading(true);
    try {
      await updateExpense(expense.id, {
        groupId: group.id,          // required by service
        description: description.trim(),
        amount:      round2(amt),
        payerId,
        payerName:   payerMember?.name || payerMember?.email || '',
        splitType,
        participants,
        shares,
        category,
      });
      toastSuccess('Expense updated!');
      await onUpdated?.();
      handleClose();
    } catch (err) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }, [description, amount, payerId, participants, splitType, customAmounts, category,
      expense, group, onUpdated, handleClose, toastSuccess, toastError]);

  const members = group?.members || [];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit Expense"
      subtitle={`Editing in ${group?.name}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? 'Hide' : 'Show'} split preview
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" loading={loading} onClick={handleSubmit} icon={SplitSquareVertical}>
              Save Changes
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Basic fields ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Description"
            placeholder="e.g. Dinner at Barbeque Nation"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: '' })); }}
            icon={FileText}
            error={errors.description}
            required
          />
          <Input
            label="Amount (₹)"
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: '' })); }}
            icon={DollarSign}
            error={errors.amount}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Paid by" value={payerId} onChange={(e) => setPayerId(e.target.value)} icon={User}>
            {members.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.uid === user?.uid ? `You (${m.name})` : m.name || m.email}
              </option>
            ))}
          </Select>
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} icon={Tag}>
            {ALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </div>

        {/* ── Split type ──────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Split type</label>
          <div className="flex gap-2">
            {['equal', 'unequal'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSplitType(type)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  splitType === type
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                }`}
              >
                {type === 'equal' ? '⚖️ Equal' : '✏️ Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Participants ────────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Participants <span className="text-slate-400 font-normal">({participants.length} selected)</span>
          </label>
          {errors.participants && <p className="text-xs text-danger-600">{errors.participants}</p>}

          <div className="space-y-2">
            {members.map((m) => {
              const isSelected = participants.includes(m.uid);
              const preview    = splitPreview.find((s) => s.uid === m.uid);

              return (
                <div
                  key={m.uid}
                  onClick={() => toggleParticipant(m.uid)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected ? 'border-primary-200 bg-primary-50' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'bg-primary-600 border-primary-600' : 'border-slate-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {m.uid === user?.uid ? `You (${m.name})` : m.name || m.email}
                    </span>
                  </div>

                  {splitType === 'unequal' && isSelected && (
                    <input
                      type="number" min="0" step="0.01" placeholder="₹0"
                      value={customAmounts[m.uid] || ''}
                      onChange={(e) => { e.stopPropagation(); handleCustomAmount(m.uid, e.target.value); }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  )}
                  {splitType === 'equal' && isSelected && preview && (
                    <span className="text-sm font-semibold text-primary-600">₹{round2(preview.amount)}</span>
                  )}
                </div>
              );
            })}
          </div>
          {errors.custom && (
            <p className="text-xs text-danger-600 bg-danger-50 px-3 py-2 rounded-lg">{errors.custom}</p>
          )}
        </div>

        {/* ── Live split preview ──────────────────────────────────── */}
        {showPreview && (
          <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-4 space-y-2">
            <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Split Preview</p>
            <SplitCalculator
              amount={amount}
              payerId={payerId}
              participants={participants}
              splitType={splitType}
              customAmounts={customAmounts}
              members={members}
              showOwes
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
