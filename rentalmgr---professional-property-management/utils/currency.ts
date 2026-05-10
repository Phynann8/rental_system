/**
 * Utility functions for currency conversion and formatting.
 */

/**
 * Formats a number as USD.
 * Example: 1500 -> "$1,500.00"
 */
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Formats a number as Khmer Riel (KHR).
 * Example: 6000000 -> "៛6,000,000" or "6,000,000 ៛"
 */
export const formatKHR = (amount: number): string => {
  return new Intl.NumberFormat('km-KH', {
    style: 'currency',
    currency: 'KHR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Converts USD to KHR based on exchange rate.
 */
export const toKHR = (amountUsd: number, exchangeRate: number): number => {
  return amountUsd * exchangeRate;
};

/**
 * Formats a USD amount with its KHR equivalent in parentheses.
 * Useful for dashboards and reports.
 */
export const formatDualCurrency = (amountUsd: number, exchangeRate: number): string => {
  const usd = formatUSD(amountUsd);
  const khr = formatKHR(toKHR(amountUsd, exchangeRate));
  return `${usd} (${khr})`;
};
