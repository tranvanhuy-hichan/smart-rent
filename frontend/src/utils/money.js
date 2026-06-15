/**
 * Utility functions for formatting money amounts.
 */

/**
 * Formats a number to Vietnamese Dong standard format (e.g., 1.500.000).
 * @param {number|string} amount 
 * @returns {string}
 */
export const formatMoney = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '0';
  return Math.round(Number(amount)).toLocaleString('vi-VN');
};

/**
 * Formats a number to a short readable format for mobile screens or charts (e.g., 1.5tr, 500k, 2.3 tỷ).
 * @param {number|string} amount 
 * @returns {string}
 */
export const formatMoneyShort = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '0';
  const n = Math.round(Number(amount));
  if (n >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1).replace('.0', '') + ' tỷ';
  }
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace('.0', '') + 'tr';
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(0) + 'k';
  }
  return n.toString();
};
