import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card   from '../common/Card';
import { formatCurrency } from '../../utils/formatters';

/**
 * BalanceCard — one of the three hero stat cards at the top of the dashboard.
 * variant: 'owed' | 'owes' | 'net'
 */
export default function BalanceCard({ variant, amount, groupCount, onClick }) {
  const navigate = useNavigate();

  const config = {
    owed: {
      label:    'You are owed',
      sub:      'across all groups',
      Icon:     TrendingUp,
      gradient: 'from-success-500 to-emerald-400',
      bg:       'bg-success-50',
      text:     'text-success-700',
      amount:   `+${formatCurrency(amount)}`,
      amtColor: 'text-success-700',
    },
    owes: {
      label:    'You owe',
      sub:      'to others',
      Icon:     TrendingDown,
      gradient: 'from-danger-500 to-rose-400',
      bg:       'bg-danger-50',
      text:     'text-danger-700',
      amount:   formatCurrency(amount),
      amtColor: 'text-danger-700',
    },
    net: {
      label:    'Net balance',
      sub:      amount >= 0 ? 'you\'re ahead!' : 'you\'re behind',
      Icon:     Minus,
      gradient: amount >= 0 ? 'from-primary-500 to-primary-400' : 'from-warning-500 to-amber-400',
      bg:       amount >= 0 ? 'bg-primary-50' : 'bg-warning-50',
      text:     amount >= 0 ? 'text-primary-700' : 'text-warning-700',
      amount:   `${amount >= 0 ? '+' : ''}${formatCurrency(amount)}`,
      amtColor: amount >= 0 ? 'text-primary-700' : 'text-warning-700',
    },
  }[variant];

  return (
    <Card
      hover
      padding="md"
      onClick={onClick || (() => navigate('/settlements'))}
      className="cursor-pointer group relative overflow-hidden"
    >
      {/* Decorative gradient blob */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${config.gradient} opacity-10 group-hover:opacity-15 transition-opacity`} />

      <div className="flex items-start justify-between relative">
        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
          <config.Icon size={20} className={config.text} />
        </div>
        <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors mt-1" />
      </div>

      <div className="mt-4 relative">
        <p className={`text-2xl font-extrabold tracking-tight ${config.amtColor}`}>
          {config.amount}
        </p>
        <p className="text-sm font-semibold text-slate-600 mt-0.5">{config.label}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {groupCount > 0 ? `${groupCount} group${groupCount !== 1 ? 's' : ''} · ` : ''}
          {config.sub}
        </p>
      </div>
    </Card>
  );
}
