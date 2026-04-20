import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Users, RefreshCw } from 'lucide-react';
import { useGroups } from '../hooks/useGroups';
import { useToast }  from '../hooks/useToast';
import GroupCard          from '../components/groups/GroupCard';
import CreateGroupModal   from '../components/groups/CreateGroupModal';
import EmptyState         from '../components/common/EmptyState';
import Button             from '../components/common/Button';
import LoadingSpinner     from '../components/common/LoadingSpinner';
import DemoSetup          from '../components/common/DemoSetup';

export default function GroupsPage() {
  const { groups, loading, deleteGroup, loadGroups } = useGroups();
  const { toastSuccess, toastError }                  = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [search,     setSearch]     = useState('');
  const [deleting,   setDeleting]   = useState(null);

  // Filter groups by search query
  const filtered = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.filter(
      (g) => g.name?.toLowerCase().includes(q) || g.category?.toLowerCase().includes(q)
    );
  }, [groups, search]);

  const handleDelete = useCallback(async (groupId) => {
    if (!window.confirm('Delete this group? This cannot be undone.')) return;
    setDeleting(groupId);
    try {
      await deleteGroup(groupId);
      toastSuccess('Group deleted.');
    } catch (err) {
      toastError(err.message);
    } finally {
      setDeleting(null);
    }
  }, [deleteGroup, toastSuccess, toastError]);

  return (
    <div className="space-y-6 animate-enter">
      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">My Groups</h1>
          <p className="text-sm text-slate-500 mt-1">
            {groups.length} group{groups.length !== 1 ? 's' : ''} · manage shared expenses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={loadGroups}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreate(true)}
          >
            New Group
          </Button>
        </div>
      </div>

      {/* ── Search bar ────────────────────────────────────────────── */}
      {groups.length > 0 && (
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search groups…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       hover:border-slate-300 transition-all"
          />
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────── */}
      {loading && groups.length === 0 ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="md" label="Loading groups…" />
        </div>
      ) : filtered.length === 0 ? (
        search ? (
          <EmptyState
            icon={Search}
            title="No groups match your search"
            message={`No results for "${search}"`}
            action={
              <Button variant="ghost" onClick={() => setSearch('')}>Clear search</Button>
            }
          />
        ) : (
          <div className="space-y-6">
            <EmptyState
              icon={Users}
              title="No groups yet"
              message="Create your first group, or load demo data to explore all features instantly."
              action={
                <Button variant="primary" icon={Plus} onClick={() => setShowCreate(true)}>
                  Create your first group
                </Button>
              }
            />
            <DemoSetup />
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Create / Join modal ────────────────────────────────────── */}
      <CreateGroupModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
