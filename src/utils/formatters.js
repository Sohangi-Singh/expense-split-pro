// ── Currency ──────────────────────────────────────────────────────
const INR = new Intl.NumberFormat('en-IN', {
  style:    'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Format a number as Indian Rupees. e.g. 1200 → "₹1,200" */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  return INR.format(amount);
}

/** Compact form for large numbers. e.g. 12500 → "₹12.5K" */
export function formatCurrencyCompact(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  if (Math.abs(amount) >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1_000)   return `₹${(amount / 1_000).toFixed(1)}K`;
  return formatCurrency(amount);
}

// ── Dates ─────────────────────────────────────────────────────────
const DATE_FMT  = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const SHORT_FMT = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

/** Format a JS Date or Firestore Timestamp. */
export function formatDate(value) {
  if (!value) return '—';
  const d = value?.toDate ? value.toDate() : new Date(value);
  return DATE_FMT.format(d);
}

export function formatDateShort(value) {
  if (!value) return '—';
  const d = value?.toDate ? value.toDate() : new Date(value);
  return SHORT_FMT.format(d);
}

/** "2 hours ago", "3 days ago", etc. */
export function timeAgo(value) {
  if (!value) return '';
  const d    = value?.toDate ? value.toDate() : new Date(value);
  const diff = Date.now() - d.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return formatDateShort(d);
}

// ── String helpers ────────────────────────────────────────────────
/** Capitalize first letter of each word */
export function titleCase(str = '') {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Truncate with ellipsis */
export function truncate(str = '', max = 30) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

/** Initials from a full name */
export function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

// ── Numbers ───────────────────────────────────────────────────────
/** Round to 2 decimal places (avoids floating-point drift in splits) */
export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
