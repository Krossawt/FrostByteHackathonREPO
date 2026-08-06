/**
 * Formats a peso amount into a compact, readable string.
 * - Values >= 1,000,000 are shown in millions (e.g. ₱1.20M)
 * - Values >= 1,000 are shown in thousands (e.g. ₱101.7K)
 * - Values below 1,000 are shown in full with comma separators (e.g. ₱850)
 *
 * Usage:
 *   formatCurrency(101700)   -> "₱101.7K"
 *   formatCurrency(506577)   -> "₱506.6K"
 *   formatCurrency(1200000)  -> "₱1.20M"
 *   formatCurrency(850)      -> "₱850"
 */
export function formatCurrency(value: number): string {
  if (value == null || isNaN(value)) {
    return "₱0";
  }

  const isNegative = value < 0;
  const absValue = Math.abs(value);

  let formatted: string;
  if (absValue >= 999_500) {
    const formattedM = (absValue / 1_000_000).toFixed(2).replace(/\.00$/, '');
    formatted = `₱${formattedM}M`;
  } else if (absValue >= 1_000) {
    const inK = absValue / 1_000;
    const formattedK = inK.toFixed(1).replace(/\.0$/, '');
    formatted = `₱${formattedK}K`;
  } else {
    formatted = `₱${absValue.toLocaleString()}`;
  }

  return isNegative ? `-${formatted}` : formatted;
}
