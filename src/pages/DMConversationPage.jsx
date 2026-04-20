import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, TrendingUp, TrendingDown, CheckCircle2,
  ChevronDown, ChevronUp, BarChart2,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getDM, subscribeToMessages, sendMessage, getBalanceHistory,
} from '../services/dmService';
import MessageBubble from '../components/dms/MessageBubble';
import BalanceGraph from '../components/dms/BalanceGraph';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ACTION_TABS = [
  { type: 'text',   label: 'Message',  Icon: Send,          color: 'primary' },
  { type: 'charge', label: '+Charge',  Icon: TrendingUp,    color: 'green'   },
  { type: 'pay',    label: '-Pay',     Icon: TrendingDown,  color: 'red'     },
  { type: 'settle', label: 'Settle',   Icon: CheckCircle2,  color: 'blue'    },
];

export default function DMConversationPage() {
  const { dmId }          = useParams();
  const { user, profile } = useAuth();
  const { toastError, toastSuccess } = useToast();
  const navigate          = useNavigate();

  const [dmData,      setDmData]     = useState(null);
  const [messages,    setMessages]   = useState([]);
  const [history,     setHistory]    = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [sending,     setSending]    = useState(false);
  const [showGraph,   setShowGraph]  = useState(false);
  const [activeTab,   setActiveTab]  = useState('text');
  const [text,        setText]       = useState('');
  const [amount,      setAmount]     = useState('');

  const bottomRef = useRef(null);
  const myUid     = user?.uid;

  // Load DM metadata + history
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [dm, hist] = await Promise.all([
          getDM(dmId),
          getBalanceHistory(dmId),
        ]);
        if (!cancelled) { setDmData(dm); setHistory(hist); }
      } catch (e) {
        if (!cancelled) toastError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dmId, toastError]);

  // Real-time messages subscription
  useEffect(() => {
    const unsub = subscribeToMessages(dmId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    return unsub;
  }, [dmId]);

  const otherParticipant = dmData?.participants?.find((p) => p.uid !== myUid);
  const myBal = dmData?.balances?.[myUid] ?? 0;

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    const amt     = parseFloat(amount);

    if (activeTab === 'text' && !trimmed) return;
    if ((activeTab === 'charge' || activeTab === 'pay') && (!amt || amt <= 0)) {
      toastError('Enter a valid amount greater than 0.');
      return;
    }

    setSending(true);
    try {
      await sendMessage(
        dmId,
        myUid,
        activeTab,
        trimmed || (activeTab === 'charge' ? `Charged ₹${amt}` : activeTab === 'pay' ? `Paid ₹${amt}` : 'Settled up'),
        activeTab !== 'text' ? amt : 0,
      );
      setText('');
      setAmount('');
      // Refresh DM balance + history
      const [dm, hist] = await Promise.all([getDM(dmId), getBalanceHistory(dmId)]);
      setDmData(dm);
      setHistory(hist);
      if (activeTab === 'settle') toastSuccess('Settled up!');
    } catch (e) {
      toastError(e.message);
    } finally {
      setSending(false);
    }
  }, [activeTab, text, amount, dmId, myUid, toastError, toastSuccess]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (!dmData) return (
    <div className="flex items-center justify-center h-full text-slate-500">
      Conversation not found.
    </div>
  );

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-white shrink-0">
        <button
          onClick={() => navigate('/dms')}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold shrink-0">
          {(otherParticipant?.name || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm leading-tight">
            {otherParticipant?.name || otherParticipant?.email}
          </p>
          <p className={clsx('text-xs font-medium', myBal > 0 ? 'text-green-600' : myBal < 0 ? 'text-red-500' : 'text-slate-400')}>
            {myBal > 0
              ? `They owe you ₹${myBal.toFixed(2)}`
              : myBal < 0
              ? `You owe ₹${Math.abs(myBal).toFixed(2)}`
              : 'All settled'}
          </p>
        </div>
        {/* Toggle graph */}
        <button
          onClick={() => setShowGraph((s) => !s)}
          className={clsx(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
            showGraph ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          <BarChart2 size={14} />
          Graph
          {showGraph ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* ── Balance graph (collapsible) ──────────────────────────── */}
      {showGraph && (
        <div className="bg-white border-b border-slate-100 px-5 py-4 shrink-0">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
            Balance History
          </p>
          <BalanceGraph
            history={history}
            myUid={myUid}
            otherName={otherParticipant?.name || 'them'}
          />
          <div className="flex gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-green-500 inline-block rounded" />
              Green = they owe you
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-500 inline-block rounded" />
              Red = you owe them
            </span>
          </div>
        </div>
      )}

      {/* ── Messages ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-slate-50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <p className="text-slate-400 text-sm">No messages yet. Say hi or send a charge!</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMe={msg.senderUid === myUid}
            myName={profile?.name || user?.email}
            otherName={otherParticipant?.name || 'them'}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ──────────────────────────────────────────── */}
      <div className="bg-white border-t border-slate-100 px-4 pt-3 pb-4 shrink-0">
        {/* Action tabs */}
        <div className="flex gap-1.5 mb-3">
          {ACTION_TABS.map(({ type, label, Icon, color }) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                activeTab === type
                  ? color === 'primary' ? 'bg-primary-600 text-white'
                    : color === 'green' ? 'bg-green-600 text-white'
                    : color === 'red'   ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Amount field for charge/pay */}
        {(activeTab === 'charge' || activeTab === 'pay') && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-slate-500 text-sm font-medium">₹</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        )}

        {/* Text input + send */}
        <div className="flex items-end gap-2">
          {activeTab !== 'settle' ? (
            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeTab === 'text'   ? 'Type a message…'
                : activeTab === 'charge' ? 'Note (optional)…'
                : 'Note (optional)…'
              }
              className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            />
          ) : (
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700 font-medium">
              Mark all debts as settled
            </div>
          )}
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-10 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 flex items-center justify-center text-white transition-colors disabled:opacity-50 shrink-0"
          >
            {sending
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
