/**
 * Centralized Currency Formatter
 * Formats monetary amounts in Indian Rupees (INR) using Indian number grouping (e.g., ₹1,25,000.00),
 * with backward-compatible support for historical order currencies (e.g. USD).
 *
 * @param {number|string} amount - Monetary amount in main units (e.g. 19.50)
 * @param {string} [currency='INR'] - Currency code ('INR', 'USD', etc.)
 * @param {object} [options={}] - Additional Intl.NumberFormat options
 * @returns {string} Formatted currency string (e.g., '₹1,960.00' or '₹1,25,000.00')
 */
export const formatPrice = (amount, currency = 'INR', options = {}) => {
  const num = Number(amount) || 0;
  const curr = (currency || 'INR').toUpperCase();
  const locale = curr === 'INR' ? 'en-IN' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(num);
};

/**
 * Convenience helper explicitly bound to Indian Rupees (INR)
 */
export const formatINR = (amount, options = {}) => {
  return formatPrice(amount, 'INR', options);
};

/**
 * Format integer paise (subunits) to formatted INR string
 * E.g. 1950 paise -> '₹19.50'
 */
export const formatPaise = (paise, options = {}) => {
  return formatPrice((Number(paise) || 0) / 100, 'INR', options);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatTime = (timeString) => {
  return timeString || '';
};
