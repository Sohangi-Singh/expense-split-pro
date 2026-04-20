import React, { useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const fmt = (v) => `₹${Math.abs(v).toFixed(0)}`;

function CustomTooltip({ active, payload, label, myUid }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: ₹{Math.abs(p.value).toFixed(2)}
          <span className="text-slate-500 ml-1">
            {p.value > 0 ? '(receivable)' : p.value < 0 ? '(owed)' : '(settled)'}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function BalanceGraph({ history, myUid, otherName }) {
  const data = useMemo(() => {
    if (!history?.length) return [];
    return history.map((h) => {
      const myBal = h[`balance_${myUid}`] ?? 0;
      return {
        date: h.date,
        receivable: myBal > 0 ? myBal : 0,
        owed:       myBal < 0 ? myBal : 0,
      };
    });
  }, [history, myUid]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        No transaction history yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.slice(5)}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 2" />
        <Tooltip content={<CustomTooltip myUid={myUid} />} />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => value === 'receivable' ? `${otherName} owes you` : `You owe ${otherName}`}
        />
        <Line
          type="monotone"
          dataKey="receivable"
          stroke="#22c55e"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#22c55e' }}
          activeDot={{ r: 6 }}
          name="receivable"
        />
        <Line
          type="monotone"
          dataKey="owed"
          stroke="#ef4444"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#ef4444' }}
          activeDot={{ r: 6 }}
          name="owed"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
