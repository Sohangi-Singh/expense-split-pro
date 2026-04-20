/**
 * nlpParser — parse natural-language expense strings into structured data.
 *
 * Handles patterns like:
 *   "Dinner 1200 split among 4"
 *   "Pizza ₹800 4 people"
 *   "Cab fare 350"
 *   "coffee 240 split 3 ways"
 *
 * Returns null if nothing useful could be extracted.
 */
export function parseNLExpense(input = '') {
  const text = input.trim();
  if (!text) return null;

  const result = {
    description: '',
    amount:      null,
    participants: null,   // inferred count (not actual UIDs)
    confidence:  'low',
  };

  // ── Extract amount ─────────────────────────────────────────────
  // Matches: "1200", "₹1200", "Rs 1200", "1,200", "1200.50"
  const amountRe = /(?:₹|rs\.?\s*)?(\d[\d,]*(?:\.\d{1,2})?)/i;
  const amountMatch = text.match(amountRe);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  // ── Extract participant count ──────────────────────────────────
  // Matches: "split among 4", "4 people", "split 3 ways", "between 5"
  const splitRe = /(?:split\s+(?:among|between|with|into)|among|between|between\s+us|(\d+)\s+(?:people|persons|friends|ways|members))/i;
  const countRe = /\b(\d+)\s*(?:people|persons|friends|ways|members)\b/i;
  const splitAmongRe = /(?:split\s+(?:among|between|with|into|equally\s+(?:among|between)?))\s*(\d+)/i;

  const countMatch      = text.match(countRe);
  const splitAmongMatch = text.match(splitAmongRe);

  if (splitAmongMatch) {
    result.participants = parseInt(splitAmongMatch[1], 10);
  } else if (countMatch) {
    result.participants = parseInt(countMatch[1], 10);
  }

  // ── Extract description ────────────────────────────────────────
  // Remove the amount and split tokens, leftover is the description
  let desc = text
    .replace(/(?:₹|rs\.?\s*)?\d[\d,]*(?:\.\d{1,2})?/gi, '')       // remove amount
    .replace(/split\s+(?:among|between|with|into|equally)?\s*\d*/gi, '')
    .replace(/\b\d+\s*(?:people|persons|friends|ways|members)\b/gi, '')
    .replace(/\bamong\b|\bbetween\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Capitalize first letter
  result.description = desc.charAt(0).toUpperCase() + desc.slice(1);

  // ── Confidence score ───────────────────────────────────────────
  if (result.amount && result.description && result.participants) {
    result.confidence = 'high';
  } else if (result.amount && result.description) {
    result.confidence = 'medium';
  }

  if (!result.amount && !result.description) return null;
  return result;
}

/**
 * EXPENSE_CATEGORIES — keyword-based auto-categorisation.
 */
const CATEGORY_KEYWORDS = {
  'Food & Drinks': ['dinner', 'lunch', 'breakfast', 'food', 'restaurant', 'pizza', 'coffee', 'cafe', 'tea', 'snack', 'groceries', 'biryani', 'swiggy', 'zomato'],
  'Transport':     ['cab', 'uber', 'ola', 'auto', 'bus', 'metro', 'train', 'flight', 'fuel', 'petrol', 'toll', 'taxi', 'rickshaw'],
  'Entertainment': ['movie', 'cinema', 'netflix', 'ticket', 'show', 'concert', 'party', 'club', 'game', 'bowling'],
  'Shopping':      ['shopping', 'amazon', 'flipkart', 'clothes', 'book', 'mall'],
  'Utilities':     ['electricity', 'wifi', 'internet', 'water', 'gas', 'rent', 'maintenance'],
  'Health':        ['medicine', 'doctor', 'hospital', 'pharmacy', 'gym'],
  'Travel':        ['hotel', 'hostel', 'airbnb', 'resort', 'trip', 'tour', 'travel', 'vacation'],
};

export function guessCategory(description = '') {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return 'Other';
}

export const ALL_CATEGORIES = [
  'Food & Drinks', 'Transport', 'Entertainment',
  'Shopping', 'Utilities', 'Health', 'Travel', 'Other',
];
