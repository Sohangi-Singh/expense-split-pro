import React, { useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Receipt, ArrowLeftRight,
  LogOut, X, SplitSquareVertical,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/groups',      label: 'Groups',       icon: Users           },
  { to: '/expenses',    label: 'Expenses',     icon: Receipt         },
  { to: '/settlements', label: 'Settlements',  icon: ArrowLeftRight  },
];

/**
 * Sidebar
 * Props:
 *   open       — controlled open state (mobile drawer)
 *   onClose    — called when overlay or close button clicked
 */
export default function Sidebar({ open, onClose }) {
  const { user, profile, logout } = useAuth();
  const { toastSuccess }          = useToast();
  const navigate                  = useNavigate();

  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials    = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = useCallback(async () => {
    await logout();
    toastSuccess('Signed out successfully.');
    navigate('/login');
  }, [logout, navigate, toastSuccess]);

  const sidebarContent = (
    <aside className="flex flex-col h-full w-64 bg-white border-r border-slate-100">
      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
            ₹
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">ExpenseSplit</p>
            <p className="text-xs text-primary-600 font-semibold leading-tight">Pro</p>
          </div>
        </div>
        {/* Close button — visible on mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'nav-link',
                isActive && 'active'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── User section + logout ─────────────────────────────────── */}
      <div className="px-3 pb-4 border-t border-slate-100 pt-3 space-y-2">
        {/* User avatar row */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="nav-link w-full text-danger-600 hover:text-danger-700 hover:bg-danger-50"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Desktop: always-visible sidebar ────────────────────────── */}
      <div className="hidden lg:block shrink-0">
        {sidebarContent}
      </div>

      {/* ── Mobile: drawer overlay ──────────────────────────────────── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
          />
          {/* Drawer slides in from left */}
          <div className="relative z-50 animate-slide-up">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
