import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';

// Maps route paths to human-readable page titles
const PAGE_TITLES = {
  '/dashboard':   'Dashboard',
  '/groups':      'My Groups',
  '/expenses':    'Expenses',
  '/settlements': 'Settlements',
};

function getTitle(pathname) {
  // Handle dynamic paths like /groups/:id
  if (pathname.startsWith('/groups/')) return 'Group Details';
  return PAGE_TITLES[pathname] || 'ExpenseSplit Pro';
}

/**
 * Navbar — top bar shown only on mobile (desktop uses sidebar header)
 * Props:
 *   onMenuClick — opens the mobile sidebar drawer
 */
export default function Navbar({ onMenuClick }) {
  const { pathname } = useLocation();

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between
                        px-4 h-14 bg-white border-b border-slate-100 shadow-sm">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Page title */}
      <h1 className="text-base font-semibold text-slate-900">{getTitle(pathname)}</h1>

      {/* Placeholder notification bell */}
      <button
        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {/* Unread dot */}
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger-500" />
      </button>
    </header>
  );
}
