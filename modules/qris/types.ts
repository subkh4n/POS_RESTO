// QRIS Types

export interface QrisConfig {
  merchantName: string;
  merchantId: string;
  terminalId: string;
  nmid: string; // National Merchant ID
  staticQris?: string; // Static QRIS string if available
}

export interface QrisTransaction {
  transactionId: string;
  amount: number;
  status: QrisTransactionStatus;
  createdAt: string;
  paidAt?: string;
  expiredAt?: string;
  qrisString?: string;
}

export enum QrisTransactionStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export interface QrisPaymentRequest {
  orderId: string;
  amount: number;
  description?: string;
}

export interface QrisPaymentResponse {
  success: boolean;
  transactionId?: string;
  qrisString?: string;
  qrisImageUrl?: string;
  expiresAt?: string;
  message?: string;
}

export interface QrisStatusCheckRequest {
  transactionId: string;
}

export interface QrisStatusCheckResponse {
  success: boolean;
  status: QrisTransactionStatus;
  paidAt?: string;
  message?: string;
}
