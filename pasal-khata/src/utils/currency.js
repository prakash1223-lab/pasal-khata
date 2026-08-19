// Nepal uses "रु" as the official rupee symbol.
const RUPEE = 'रु';

/**
 * Format amount as Nepali Rupees.
 * Handles: null, undefined, NaN, string "0", string "3130.50", number 0, number 3130.50
 * @param {number|string|null|undefined} amount
 * @returns {string} e.g. "रु 1,000" or "रु 0"
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return `${RUPEE} 0`;
  const num = parseFloat(amount);
  if (isNaN(num)) return `${RUPEE} 0`;
  return `${RUPEE} ${num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
}

/**
 * Format amount without rupee symbol.
 */
export function formatAmount(amount) {
  if (amount === null || amount === undefined) return '0';
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

/**
 * Safe money addition — avoids floating point errors.
 * @param {...number} values
 * @returns {number}
 */
export function addMoney(...values) {
  return Math.round(values.reduce((s, v) => s + (parseFloat(v) || 0), 0) * 100) / 100;
}
