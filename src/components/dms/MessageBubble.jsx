import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, MessageCircle } from 'lucide-react';
import clsx from 'clsx';

function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ msg, isMe, myName, otherName }) {
  const sender = isMe ? 'You' : otherName;

  if (msg.type === 'text') {
    return (
      <div className={clsx('flex', isMe ? 'justify-end' : 'justify-start')}>
        <div
          className={clsx(
            'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm',
            isMe
              ? 'bg-primary-600 text-white rounded-br-sm'
              : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm'
          )}
        >
          <p>{msg.text}</p>
          <p className={clsx('text-xs mt-1', isMe ? 'text-primary-200' : 'text-slate-400')}>
            {formatTime(msg.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  if (msg.type === 'charge') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3 text-center max-w-xs shadow-sm">
          <div className="flex items-center justify-center gap-2 text-green-700 font-semibold text-sm">
            <TrendingUp size={16} />
            <span>
              {isMe
                ? `You charged ${otherName}`
                : `${otherName} charged you`}
            </span>
          </div>
          <p className="text-2xl font-bold text-green-700 mt-1">₹{msg.amount?.toFixed(2)}</p>
          {msg.text && <p className="text-xs text-slate-500 mt-1 italic">{msg.text}</p>}
          <p className="text-xs text-slate-400 mt-1">{formatTime(msg.createdAt)}</p>
        </div>
      </div>
    );
  }

  if (msg.type === 'pay') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-center max-w-xs shadow-sm">
          <div className="flex items-center justify-center gap-2 text-red-600 font-semibold text-sm">
            <TrendingDown size={16} />
            <span>
              {isMe
                ? `You paid ${otherName}`
                : `${otherName} paid you`}
            </span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">₹{msg.amount?.toFixed(2)}</p>
          {msg.text && <p className="text-xs text-slate-500 mt-1 italic">{msg.text}</p>}
          <p className="text-xs text-slate-400 mt-1">{formatTime(msg.createdAt)}</p>
        </div>
      </div>
    );
  }

  if (msg.type === 'settle') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 text-center max-w-xs shadow-sm">
          <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-sm">
            <CheckCircle2 size={16} />
            <span>{isMe ? 'You settled up' : `${otherName} settled up`}</span>
          </div>
          {msg.text && <p className="text-xs text-slate-500 mt-1 italic">{msg.text}</p>}
          <p className="text-xs text-slate-400 mt-1">{formatTime(msg.createdAt)}</p>
        </div>
      </div>
    );
  }

  return null;
}
