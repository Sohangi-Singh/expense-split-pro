import React, { useState } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as PieTooltip,
  BarChart, Bar, XAxis, YAxis, Tooltip as BarTooltip,
  CartesianGrid, AreaChart, Area,
} from 'recharts';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';

// Palette for category slices
const PALETTE = [
  '#6366f1', '#a855f7', '#ec4899', '#f59e0b',
  '#22c55e', '#06b6d4', '#ef4444', '#8b5cf6',
];

// ── Custom tooltip for pie ─────────────────────────────────────────
function PieCustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-white border border-slate-100 shadow-card rounded-xl px-3 py-2 text-sm">
      <p className="font-semibold text-slate-800">{name}</p>
      <p className="text-primary-600 font-bold">{formatCurrency(value)}</p>
    </div>
  );
}

// ── Custom tooltip for bar / area ──────────────────────────────────
function BarCustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 shadow-card rounded-xl px-3 py-2 text-sm">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="font-bold text-slate-900">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

// ── Donut label ────────────────────────────────────────────────────
function DonutLabel({ viewBox, total }) {
  const { cx, cy } = viewBox;
  return (
    <>
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-slate-900" style={{ fontSize: 20, fontWeight: 700 }}>
        {formatCurrency(total)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 11 }}>
        total spent
      </text>
    </>
  );
}

/**
 * SpendingChart
 * Props:
 *   categoryData  — [{ name, value }]  for the donut
 *   monthlyData   — [{ name, amount }] for bar / area chart
 */
export default function SpendingChart({ categoryData = [], monthlyData = [] }) {
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'area'

  const totalSpent = categoryData.reduce((s, c) => s + c.value, 0);
  const hasData    = categoryData.length > 0 || monthlyData.some((m) => m.amount > 0);

  if (!hasData) {
    return (
      <Card padding="md">
        <Card.Header title="Spending Analytics" subtitle="Add expenses to see charts" />
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-sm text-slate-400">No spending data yet</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* ── Donut: category breakdown ──────────────────────────────── */}
      <Card padding="md">
        <Card.Header title="By Category" subtitle="Where your money goes" />
        <div className="flex items-center gap-4">
          {/* Donut */}
          <div className="w-40 h-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%" cy="50%"
                  innerRadius={44} outerRadius={64}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                  <DonutLabel viewBox={{ cx: 80, cy: 80 }} total={totalSpent} />
                </Pie>
                <PieTooltip content={<PieCustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2 min-w-0">
            {categoryData.slice(0, 6).map(({ name, value }, i) => {
              const pct = totalSpent > 0 ? Math.round((value / totalSpent) * 100) : 0;
              return (
                <div key={name} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                  />
                  <span className="text-xs text-slate-600 truncate flex-1">{name}</span>
                  <span className="text-xs font-semibold text-slate-800 shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── Bar / Area: monthly spending ──────────────────────────── */}
      <Card padding="md">
        <Card.Header
          title="Monthly Spending"
          subtitle="Last 6 months"
          action={
            <div className="flex gap-1 bg-surface-100 rounded-lg p-0.5">
              {['bar', 'area'].map((t) => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    chartType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'bar' ? '▐▌' : '∿'}
                </button>
              ))}
            </div>
          }
        />

        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={monthlyData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                  width={45}
                />
                <BarTooltip content={<BarCustomTooltip />} cursor={{ fill: '#f1f5f9', radius: 6 }} />
                <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                  width={45}
                />
                <BarTooltip content={<BarCustomTooltip />} />
                <Area
                  type="monotone" dataKey="amount"
                  stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#areaGrad)"
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
