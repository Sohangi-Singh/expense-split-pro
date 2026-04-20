import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// ── Lazy-loaded pages (demonstrates React.lazy + Suspense) ──────────
const LandingPage      = lazy(() => import('./pages/LandingPage'));
const AuthPage         = lazy(() => import('./pages/AuthPage'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const GroupsPage       = lazy(() => import('./pages/GroupsPage'));
const GroupDetailPage  = lazy(() => import('./pages/GroupDetailPage'));
const ExpensesPage     = lazy(() => import('./pages/ExpensesPage'));
const SettlementsPage       = lazy(() => import('./pages/SettlementsPage'));
const DMsPage               = lazy(() => import('./pages/DMsPage'));
const DMConversationPage    = lazy(() => import('./pages/DMConversationPage'));

// ── Guard: redirect to /login if not authenticated ───────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ── Guard: redirect to /dashboard if already logged in ───────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login"  element={<PublicRoute><AuthPage mode="login" /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><AuthPage mode="signup" /></PublicRoute>} />

        {/* Protected routes – all share the sidebar Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard"        element={<DashboardPage />} />
          <Route path="/groups"           element={<GroupsPage />} />
          <Route path="/groups/:groupId"  element={<GroupDetailPage />} />
          <Route path="/expenses"         element={<ExpensesPage />} />
          <Route path="/settlements"      element={<SettlementsPage />} />
          <Route path="/dms"              element={<DMsPage />} />
          <Route path="/dms/:dmId"        element={<DMConversationPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
