import { useContext } from 'react';
import { GroupContext } from '../context/GroupContext';

export function useGroups() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroups must be used within a GroupProvider');
  return ctx;
}
