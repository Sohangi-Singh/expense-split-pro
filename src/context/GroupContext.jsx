import React, {
  createContext, useState, useEffect,
  useCallback, useMemo,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  fetchUserGroups, createGroup as svcCreate,
  deleteGroup as svcDelete, fetchGroup,
} from '../services/groupService';

export const GroupContext = createContext(null);

export function GroupProvider({ children }) {
  const { user } = useAuth();

  const [groups,      setGroups]      = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  // ── Load all groups for the logged-in user ─────────────────────
  const loadGroups = useCallback(async () => {
    if (!user) { setGroups([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserGroups(user.uid);
      setGroups(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Re-fetch whenever the authenticated user changes
  useEffect(() => { loadGroups(); }, [loadGroups]);

  // ── Load a single group (for detail page) ─────────────────────
  const loadGroup = useCallback(async (groupId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroup(groupId);
      setActiveGroup(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Create a new group ─────────────────────────────────────────
  const createGroup = useCallback(async (groupData) => {
    if (!user) return;
    const newId = await svcCreate({
      ...groupData,
      creatorUid:   user.uid,
      creatorName:  user.displayName || user.email,
      creatorEmail: user.email,
    });
    // Optimistically add to local list
    const newGroup = {
      id:      newId,
      ...groupData,
      createdBy: user.uid,
      members: [{ uid: user.uid, name: user.displayName || user.email, email: user.email, role: 'admin' }],
      totalExpenses: 0,
    };
    setGroups((prev) => [newGroup, ...prev]);
    return newId;
  }, [user]);

  // ── Delete a group ─────────────────────────────────────────────
  const deleteGroup = useCallback(async (groupId) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const memberUids = (group.members || []).map((m) => m.uid);
    await svcDelete(groupId, memberUids);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (activeGroup?.id === groupId) setActiveGroup(null);
  }, [groups, activeGroup]);

  // ── Refresh active group after expenses are added ─────────────
  const refreshActiveGroup = useCallback(async () => {
    if (!activeGroup?.id) return;
    const updated = await fetchGroup(activeGroup.id);
    setActiveGroup(updated);
    setGroups((prev) => prev.map((g) => g.id === updated.id ? updated : g));
  }, [activeGroup]);

  const value = useMemo(() => ({
    groups, activeGroup, loading, error,
    loadGroups, loadGroup, createGroup, deleteGroup, refreshActiveGroup,
    setActiveGroup,
  }), [groups, activeGroup, loading, error, loadGroups, loadGroup, createGroup, deleteGroup, refreshActiveGroup]);

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
}
