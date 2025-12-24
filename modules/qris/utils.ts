// QRIS Utility Functions

import { QRIS_CONFIG, QRIS_SETTINGS } from "./config";
import { QrisTransaction, QrisTransactionStatus } from "./types";

/**
 * Generate a unique transaction ID for QRIS
 */
export const generateQrisTransactionId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `QRIS-${timestamp}-${random}`;
};

/**
 * Calculate transaction expiry time
 */
export const calculateExpiryTime = (
  minutes: number = QRIS_SETTINGS.expiryMinutes
): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
};

/**
 * Format amount for QRIS display
 */
export const formatQrisAmount = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Check if transaction is expired
 */
export const isTransactionExpired = (expiredAt: string): boolean => {
  return new Date(expiredAt) < new Date();
};

/**
 * Get remaining time for transaction in seconds
 */
export const getRemainingTime = (expiredAt: string): number => {
  const remaining = new Date(expiredAt).getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
};

/**
 * Format remaining time as MM:SS
 */
export const formatRemainingTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

/**
 * Create a new QRIS transaction object
 */
export const createQrisTransaction = (
  orderId: string,
  amount: number,
  qrisString?: string
): QrisTransaction => {
  const now = new Date();
  const expiry = calculateExpiryTime();

  return {
    transactionId: generateQrisTransactionId(),
    amount,
    status: QrisTransactionStatus.PENDING,
    createdAt: now.toISOString(),
    expiredAt: expiry.toISOString(),
    qrisString: qrisString || QRIS_CONFIG.staticQris,
  };
};

/**
 * Generate dynamic QRIS string with amount embedded
 * Note: This is a simplified version. Real implementation depends on your QRIS provider.
 */
export const generateDynamicQrisString = (
  baseQris: string,
  amount: number
): string => {
  // For static QRIS, return as-is
  // Dynamic QRIS generation requires specific CRC calculation
  // This is a placeholder - integrate with your QRIS provider's SDK
  return baseQris;
};

/**
 * Validate QRIS string format
 */
export const validateQrisString = (qrisString: string): boolean => {
  // Basic validation - QRIS should start with specific characters
  // and have proper length
  if (!qrisString || qrisString.length < 50) {
    return false;
  }

  // QRIS typically starts with '00' (Format Indicator)
  if (!qrisString.startsWith("00")) {
    return false;
  }

  return true;
};

/**
 * Get status display text in Indonesian
 */
export const getStatusDisplayText = (status: QrisTransactionStatus): string => {
  const statusMap: Record<QrisTransactionStatus, string> = {
    [QrisTransactionStatus.PENDING]: "Menunggu Pembayaran",
    [QrisTransactionStatus.SUCCESS]: "Pembayaran Berhasil",
    [QrisTransactionStatus.FAILED]: "Pembayaran Gagal",
    [QrisTransactionStatus.EXPIRED]: "Transaksi Kadaluarsa",
    [QrisTransactionStatus.CANCELLED]: "Transaksi Dibatalkan",
  };
  return statusMap[status] || status;
};

/**
 * Get status color class for UI
 */
export const getStatusColorClass = (status: QrisTransactionStatus): string => {
  const colorMap: Record<QrisTransactionStatus, string> = {
    [QrisTransactionStatus.PENDING]: "text-blue-600 bg-blue-50",
    [QrisTransactionStatus.SUCCESS]: "text-emerald-600 bg-emerald-50",
    [QrisTransactionStatus.FAILED]: "text-red-600 bg-red-50",
    [QrisTransactionStatus.EXPIRED]: "text-gray-600 bg-gray-50",
    [QrisTransactionStatus.CANCELLED]: "text-orange-600 bg-orange-50",
  };
  return colorMap[status] || "text-gray-600 bg-gray-50";
};
