import React, { useState, useCallback } from 'react';
import { UserPlus, Crown, Trash2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import { addMemberByEmail, removeMember } from '../../services/groupService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

export default function GroupMembersList({ group, onMembersChanged }) {
  const { user }                       = useAuth();
  const { toastSuccess, toastError }   = useToast();
  const [emailInput, setEmailInput]    = useState('');
  const [adding,     setAdding]        = useState(false);
  const [removing,   setRemoving]      = useState(null); // uid being removed

  const isAdmin = group?.createdBy === user?.uid;

  const handleAdd = useCallback(async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toastError('Enter a valid email address.'); return;
    }
    setAdding(true);
    try {
      await addMemberByEmail(group.id, email);
      toastSuccess(`Invite sent to ${email}`);
      setEmailInput('');
      onMembersChanged?.();
    } catch (err) {
      toastError(err.message);
    } finally {
      setAdding(false);
    }
  }, [emailInput, group.id, onMembersChanged, toastSuccess, toastError]);

  const handleRemove = useCallback(async (member) => {
    if (!window.confirm(`Remove ${member.name} from the group?`)) return;
    setRemoving(member.uid);
    try {
      await removeMember(group.id, member);
      toastSuccess(`${member.name} removed from group.`);
      onMembersChanged?.();
    } catch (err) {
      toastError(err.message);
    } finally {
      setRemoving(null);
    }
  }, [group.id, onMembersChanged, toastSuccess, toastError]);

  const members = group?.members || [];

  return (
    <div className="space-y-4">
      {/* Members list */}
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.uid} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 transition-colors group">
            <div className="flex items-center gap-3">
              <Avatar name={m.name || m.email} size="sm" />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-slate-800">{m.name || 'Unknown'}</p>
                  {m.role === 'admin' && (
                    <Crown size={12} className="text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-slate-400">{m.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={m.role === 'admin' ? 'warning' : 'default'} size="sm">
                {m.role === 'admin' ? 'Admin' : 'Member'}
              </Badge>
              {/* Admin can remove non-admin members (not themselves) */}
              {isAdmin && m.uid !== user?.uid && m.role !== 'admin' && (
                <button
                  onClick={() => handleRemove(m)}
                  disabled={removing === m.uid}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300
                             hover:text-danger-500 hover:bg-danger-50 transition-all"
                >
                  {removing === m.uid
                    ? <span className="w-3.5 h-3.5 border-2 border-danger-300 border-t-danger-500 rounded-full animate-spin block" />
                    : <Trash2 size={14} />
                  }
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Add member input — admin only */}
      {isAdmin && (
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <Input
            placeholder="Add member by email…"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            icon={UserPlus}
            fullWidth
          />
          <Button variant="secondary" onClick={handleAdd} loading={adding} size="md" className="shrink-0">
            Add
          </Button>
        </div>
      )}

      {/* Invite code hint */}
      {isAdmin && group.inviteCode && (
        <div className="flex items-center justify-between p-3 bg-primary-50 rounded-xl border border-primary-100">
          <div>
            <p className="text-xs font-semibold text-primary-700">Invite code</p>
            <p className="text-lg font-mono font-bold text-primary-800 tracking-widest mt-0.5">
              {group.inviteCode}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(group.inviteCode);
              toastSuccess('Invite code copied!');
            }}
          >
            Copy
          </Button>
        </div>
      )}
    </div>
  );
}
