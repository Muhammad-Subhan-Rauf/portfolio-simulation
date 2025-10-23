import { TEXTS } from '../constants';

/**
 * Formats a number according to the locale specified in constants.
 * @param {number} n - The number to format.
 * @param {number} decimals - The number of decimal places.
 * @returns {string} The formatted number string.
 */
export function fmt(n, decimals = 2) {
  if (typeof n !== 'number') return 'N/A';
  return n.toLocaleString(TEXTS.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}