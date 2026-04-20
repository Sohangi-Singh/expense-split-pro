import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar  from './Navbar';

/**
 * Layout wraps all authenticated pages.
 *
 * Desktop: fixed sidebar left, scrollable content right
 * Mobile:  top navbar + slide-in drawer sidebar
 */
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar  = useCallback(() => setSidebarOpen(true),  []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Sidebar handles both desktop (always visible) and mobile (drawer) */}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <Navbar onMenuClick={openSidebar} />

        {/* Page content scrolls independently */}
        <main className="flex-1 overflow-y-auto">
          {/* Max-width container with padding */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
