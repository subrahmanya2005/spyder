// Shared amount validation constants and helpers
// Used across frontend and backend

export const AMOUNT_MIN = 1;
export const AMOUNT_MAX = 1_000_000_000_000; // 1 trillion

/**
 * Validates a monetary amount.
 * @param {number|string} amount - The value to check
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateAmount(amount) {
  const n = Number(amount);

  if (amount === '' || amount === null || amount === undefined || isNaN(n)) {
    return { valid: false, error: 'Amount must be at least ₹1' };
  }
  if (n < AMOUNT_MIN) {
    return { valid: false, error: 'Amount must be at least ₹1' };
  }
  if (n > AMOUNT_MAX) {
    return { valid: false, error: 'Amount exceeds allowed limit' };
  }
  return { valid: true, error: null };
}
