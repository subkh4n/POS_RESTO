// QRIS Configuration for Midtrans Integration

/**
 * Midtrans Configuration
 * - Sandbox: For testing (no real money)
 * - Production: For real transactions
 */
export const MIDTRANS_CONFIG = {
  // Set to true for production environment
  isProduction: import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === "true" || false,

  // Client Key - safe to expose in frontend
  clientKey: import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "YOUR_CLIENT_KEY",
};

/**
 * QRIS Payment Settings
 */
export const QRIS_SETTINGS = {
  // Transaction expiry time in minutes
  expiryMinutes: 15,

  // Show amount in payment display
  showAmountInDisplay: true,
};

/**
 * Get Midtrans Snap script URL based on environment
 */
export const getMidtransSnapUrl = (): string => {
  return MIDTRANS_CONFIG.isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
};
