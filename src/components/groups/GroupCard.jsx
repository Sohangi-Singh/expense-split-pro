import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Receipt, ArrowRight, Plane, Home, Briefcase, PartyPopper, MoreVertical, Trash2 } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { AvatarGroup } from '../common/Avatar';
import { formatCurrency, timeAgo } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';

// Category → icon + color mapping
const CATEGORY_META = {
  'Trip':         { icon: Plane,        color: 'bg-sky-100    text-sky-600'   },
  'Home':         { icon: Home,         color: 'bg-emerald-100 text-emerald-600' },
  'Work':         { icon: Briefcase,    color: 'bg-amber-100  text-amber-600' },
  'Party':        { icon: PartyPopper,  color: 'bg-pink-100   text-pink-600'  },
  'Friends':      { icon: Users,        color: 'bg-violet-100 text-violet-600'},
  'Other':        { icon: Receipt,      color: 'bg-slate-100  text-slate-600' },
};

function getCategoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META['Other'];
}

export default function GroupCard({ group, onDelete }) {
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isAdmin = group.createdBy === user?.uid;
  const meta    = getCategoryMeta(group.category);
  const Icon    = meta.icon;

  const memberNames = useMemo(
    () => (group.members || []).map((m) => m.name || m.email),
    [group.members]
  );

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete?.(group.id);
  };

  return (
    <Card
      hover
      className="group relative cursor-pointer select-none"
      onClick={() => navigate(`/groups/${group.id}`)}
    >
      {/* ── Admin kebab menu ────────────────────────────────────── */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100
                       text-slate-400 hover:text-slate-600 transition-all"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl shadow-modal border border-slate-100 py-1 animate-fade-in">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <Trash2 size={14} /> Delete group
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Card body ───────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        {/* Category icon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
          <Icon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-slate-900 truncate">{group.name}</h3>
            <Badge variant="default" size="sm">{group.category || 'Other'}</Badge>
          </div>
          {group.description && (
            <p className="text-xs text-slate-400 truncate">{group.description}</p>
          )}
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────── */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AvatarGroup names={memberNames} max={4} size="xs" />
          <span className="text-xs text-slate-500">
            {group.members?.length || 0} member{group.members?.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-400">Total spent</p>
            <p className="text-sm font-semibold text-slate-800">
              {formatCurrency(group.totalExpenses || 0)}
            </p>
          </div>
          <ArrowRight size={16} className="text-slate-300 group-hover:text-primary-400 transition-colors" />
        </div>
      </div>

      {/* Created-at timestamp */}
      {group.createdAt && (
        <p className="text-[11px] text-slate-300 mt-2">
          Created {timeAgo(group.createdAt)}
        </p>
      )}
    </Card>
  );
}
