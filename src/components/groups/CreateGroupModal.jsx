import React, { useState, useCallback } from 'react';
import { Users, Tag, FileText, UserPlus, X, Link as LinkIcon } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input, { Select } from '../common/Input';
import { useGroups } from '../../hooks/useGroups';
import { useToast } from '../../hooks/useToast';
import { addMemberByEmail, joinGroupByCode } from '../../services/groupService';

const CATEGORIES = ['Trip', 'Home', 'Work', 'Party', 'Friends', 'Other'];

/** Tab — 'create' | 'join' */
export default function CreateGroupModal({ open, onClose }) {
  const { createGroup, loadGroups } = useGroups();
  const { toastSuccess, toastError }  = useToast();

  const [tab, setTab] = useState('create');

  // ── Create tab state ───────────────────────────────────────────
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('Other');
  const [emailInput,  setEmailInput]  = useState('');
  const [pendingEmails, setPendingEmails] = useState([]);
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);

  // ── Join tab state ─────────────────────────────────────────────
  const [inviteCode,  setInviteCode]  = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const resetForm = useCallback(() => {
    setName(''); setDescription(''); setCategory('Other');
    setEmailInput(''); setPendingEmails([]); setErrors({});
    setInviteCode(''); setTab('create');
  }, []);

  const handleClose = useCallback(() => { resetForm(); onClose(); }, [resetForm, onClose]);

  // ── Add email to pending list ──────────────────────────────────
  const addEmail = useCallback(() => {
    const em = emailInput.trim().toLowerCase();
    if (!em) return;
    if (!/\S+@\S+\.\S+/.test(em)) { setErrors((p) => ({ ...p, email: 'Invalid email address.' })); return; }
    if (pendingEmails.includes(em)) { setErrors((p) => ({ ...p, email: 'Already added.' })); return; }
    setPendingEmails((prev) => [...prev, em]);
    setEmailInput('');
    setErrors((p) => ({ ...p, email: '' }));
  }, [emailInput, pendingEmails]);

  const removeEmail = (em) => setPendingEmails((prev) => prev.filter((e) => e !== em));

  // ── Create group ───────────────────────────────────────────────
  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    if (!name.trim()) { setErrors({ name: 'Group name is required.' }); return; }

    setLoading(true);
    try {
      const groupId = await createGroup({ name: name.trim(), description, category });

      // Add pending members by email
      for (const email of pendingEmails) {
        try { await addMemberByEmail(groupId, email); }
        catch { /* non-fatal — member can be added later */ }
      }

      toastSuccess(`Group "${name.trim()}" created!`);
      await loadGroups();
      handleClose();
    } catch (err) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }, [name, description, category, pendingEmails, createGroup, loadGroups, toastSuccess, toastError, handleClose]);

  // ── Join by invite code ────────────────────────────────────────
  const handleJoin = useCallback(async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) { setErrors({ code: 'Enter an invite code.' }); return; }
    setJoinLoading(true);
    try {
      await loadGroups();   // refresh will pull the newly joined group
      toastSuccess('Joined group successfully!');
      handleClose();
    } catch (err) {
      toastError(err.message);
      setErrors({ code: err.message });
    } finally {
      setJoinLoading(false);
    }
  }, [inviteCode, loadGroups, toastSuccess, toastError, handleClose]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={tab === 'create' ? 'Create a group' : 'Join a group'}
      subtitle={tab === 'create' ? 'Set up a shared expense group' : 'Enter an invite code to join'}
      size="md"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={tab === 'create' ? loading : joinLoading}
            onClick={tab === 'create' ? handleCreate : handleJoin}
            icon={tab === 'create' ? Users : LinkIcon}
          >
            {tab === 'create' ? 'Create group' : 'Join group'}
          </Button>
        </div>
      }
    >
      {/* ── Tab switcher ────────────────────────────────────────── */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 mb-6">
        {['create', 'join'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'create' ? '+ Create new' : '🔗 Join by code'}
          </button>
        ))}
      </div>

      {/* ── Create form ─────────────────────────────────────────── */}
      {tab === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Group name"
            placeholder="e.g. Goa Trip 2025"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
            icon={Users}
            error={errors.name}
            required
          />

          <Input
            label="Description"
            placeholder="Optional note about this group"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            icon={FileText}
          />

          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            icon={Tag}
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>

          {/* Add members by email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Invite members <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="friend@email.com"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                icon={UserPlus}
                error={errors.email}
                fullWidth
              />
              <Button type="button" variant="secondary" onClick={addEmail} size="md" className="shrink-0">
                Add
              </Button>
            </div>

            {/* Pending emails list */}
            {pendingEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {pendingEmails.map((em) => (
                  <span key={em} className="flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                    {em}
                    <button type="button" onClick={() => removeEmail(em)} className="hover:text-danger-500 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>
      )}

      {/* ── Join form ───────────────────────────────────────────── */}
      {tab === 'join' && (
        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            label="Invite code"
            placeholder="e.g. A3B9KZ"
            value={inviteCode}
            onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setErrors({}); }}
            icon={LinkIcon}
            error={errors.code}
            hint="Ask your group admin for the 6-character invite code."
          />
        </form>
      )}
    </Modal>
  );
}
