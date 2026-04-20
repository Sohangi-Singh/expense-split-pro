import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Search, X, UserCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getUserDMs, searchUsers, getOrCreateDM, dmId } from '../services/dmService';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function DMsPage() {
  const { user, profile } = useAuth();
  const { toastError }    = useToast();
  const navigate          = useNavigate();

  const [dms,      setDms]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [results,  setResults]  = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const loadDMs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserDMs(user.uid);
      setDms(data);
    } catch (e) {
      toastError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user, toastError]);

  useEffect(() => { loadDMs(); }, [loadDMs]);

  const handleSearch = useCallback(async (term) => {
    setSearch(term);
    if (!term.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const users = await searchUsers(term, user.uid);
      setResults(users);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [user]);

  const handleStartDM = useCallback(async (other) => {
    try {
      const id = await getOrCreateDM(
        user.uid,
        profile?.name || user.displayName || user.email,
        user.email,
        other.uid,
        other.name,
        other.email,
      );
      navigate(`/dms/${id}`);
    } catch (e) {
      toastError(e.message);
    }
  }, [user, profile, navigate, toastError]);

  const myUid = user?.uid;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personal DMs</h1>
          <p className="text-sm text-slate-500 mt-0.5">One-on-one money tracking &amp; chat</p>
        </div>
        <button
          onClick={() => setShowSearch((s) => !s)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* New chat search */}
      {showSearch && (
        <div className="card p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Search size={16} className="text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="flex-1 text-sm outline-none text-slate-800 placeholder-slate-400"
            />
            {search && (
              <button onClick={() => { setSearch(''); setResults([]); }} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          {searching && <p className="text-xs text-slate-400">Searching…</p>}
          {results.map((u) => (
            <button
              key={u.uid}
              onClick={() => handleStartDM(u)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(u.name || u.email)?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
            </button>
          ))}
          {!searching && search && results.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">No users found</p>
          )}
        </div>
      )}

      {/* DM list */}
      {loading ? (
        <LoadingSpinner />
      ) : dms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <MessageSquare size={28} className="text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No conversations yet</h3>
          <p className="text-sm text-slate-400">Start a chat to track 1-on-1 money with a friend.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dms.map((dm) => {
            const other = dm.participants?.find((p) => p.uid !== myUid);
            const myBal = dm.balances?.[myUid] ?? 0;
            const initials = (other?.name || other?.email || '?')[0].toUpperCase();

            return (
              <button
                key={dm.id}
                onClick={() => navigate(`/dms/${dm.id}`)}
                className="w-full card p-4 flex items-center gap-4 hover:shadow-md transition-all text-left"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-base shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{other?.name || other?.email}</p>
                  <p className="text-xs text-slate-400 truncate">{other?.email}</p>
                </div>
                {myBal !== 0 && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    myBal > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {myBal > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    ₹{Math.abs(myBal).toFixed(2)}
                    <span className="font-normal">{myBal > 0 ? 'owed to you' : 'you owe'}</span>
                  </div>
                )}
                {myBal === 0 && (
                  <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Settled</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
