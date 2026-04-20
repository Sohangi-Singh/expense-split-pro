import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, UserPlus, CheckCircle, Clock } from 'lucide-react';
import Card      from '../common/Card';
import EmptyState from '../common/EmptyState';
import { formatCurrency, timeAgo } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';

/**
 * ActivityFeed — shows the N most recent expenses across all groups.
 *
 * Props:
 *   expenses — flat array of expense docs (already annotated with groupName, groupId)
 *   groups   — group list for navigation
 *   limit    — max items to show (default 8)
 */
export default function ActivityFeed({ expenses = [], groups = [], limit = 8 }) {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const recent = expenses.slice(0, limit);

  if (recent.length === 0) {
    return (
      <Card padding="md">
        <Card.Header title="Recent Activity" subtitle="Your latest expenses" />
        <EmptyState
          icon={Clock}
          title="No activity yet"
          message="Expenses you add will appear here."
          compact
        />
      </Card>
    );
  }

  return (
    <Card padding="md">
      <Card.Header
        title="Recent Activity"
        subtitle={`${recent.length} latest expenses`}
        action={
          <button
            onClick={() => navigate('/expenses')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            View all →
          </button>
        }
      />

      <ul className="space-y-1">
        {recent.map((exp, idx) => {
          const isMyExpense  = exp.payerId === user?.uid;
          const myShare      = exp.shares?.find((s) => s.uid === user?.uid);
          const myOwes       = myShare?.owes || 0;

          return (
            <li
              key={exp.id || idx}
              onClick={() => exp.groupId && navigate(`/groups/${exp.groupId}`)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 cursor-pointer transition-colors group"
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                exp.settled ? 'bg-success-50' : 'bg-primary-50'
              }`}>
                {exp.settled
                  ? <CheckCircle size={16} className="text-success-500" />
                  : <Receipt     size={16} className="text-primary-500" />
                }
              </div>

              {/* Description + group */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{exp.description}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                  {exp.groupName && (
                    <>
                      <span className="text-primary-500 font-medium">{exp.groupName}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>{timeAgo(exp.createdAt)}</span>
                </div>
              </div>

              {/* Amount + owe indicator */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-900">{formatCurrency(exp.amount)}</p>
                {myOwes > 0 && !isMyExpense && !exp.settled && (
                  <p className="text-xs text-danger-500 font-medium">-{formatCurrency(myOwes)}</p>
                )}
                {isMyExpense && (exp.shares?.length || 0) > 1 && !exp.settled && (
                  <p className="text-xs text-success-500 font-medium">you paid</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
