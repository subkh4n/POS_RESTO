// QRIS Payment Modal with Midtrans Snap Integration

import React, { useState, useEffect } from "react";
import { QrCode, X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { GOOGLE_SCRIPT_URL } from "../../constants";

// Declare Snap type for TypeScript
declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess: (result: any) => void;
          onPending: (result: any) => void;
          onError: (result: any) => void;
          onClose: () => void;
        }
      ) => void;
    };
  }
}

interface QrisPaymentModalProps {
  isOpen: boolean;
  amount: number;
  orderId: string;
  customerName?: string;
  onClose: () => void;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentPending?: (transactionId: string) => void;
  onPaymentFailed?: (reason: string) => void;
}

const QrisPaymentModal: React.FC<QrisPaymentModalProps> = ({
  isOpen,
  amount,
  orderId,
  customerName = "Customer",
  onClose,
  onPaymentSuccess,
  onPaymentPending,
  onPaymentFailed,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const formatAmount = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  // Function to create QRIS transaction and open Snap popup
  const initiatePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request Snap token from backend (Google Apps Script)
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "createQrisTransaction",
          orderId: orderId,
          amount: amount,
          customerName: customerName,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.token) {
        throw new Error(data.message || "Gagal mendapatkan token pembayaran");
      }

      setTransactionId(data.orderId);

      // Check if Snap is loaded
      if (!window.snap) {
        throw new Error(
          "Midtrans Snap tidak tersedia. Pastikan script sudah dimuat."
        );
      }

      // Open Midtrans Snap popup
      window.snap.pay(data.token, {
        onSuccess: (result: any) => {
          console.log("Payment success:", result);
          onPaymentSuccess(data.orderId);
        },
        onPending: (result: any) => {
          console.log("Payment pending:", result);
          if (onPaymentPending) {
            onPaymentPending(data.orderId);
          }
        },
        onError: (result: any) => {
          console.error("Payment error:", result);
          setError("Pembayaran gagal. Silakan coba lagi.");
          if (onPaymentFailed) {
            onPaymentFailed(result.status_message || "Payment failed");
          }
        },
        onClose: () => {
          console.log("Snap popup closed");
          // Don't automatically close the modal, let user decide
        },
      });

      setIsLoading(false);
    } catch (err) {
      console.error("Error initiating payment:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setIsLoading(false);
    }
  };

  // Auto-initiate payment when modal opens
  useEffect(() => {
    if (isOpen && amount > 0) {
      initiatePayment();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setTransactionId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <QrCode size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Pembayaran QRIS</h2>
              <p className="text-blue-100 text-sm">via Midtrans</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Amount Display */}
          <div className="text-center mb-6">
            <p className="text-gray-500 text-sm mb-1">Total Pembayaran</p>
            <p className="text-3xl font-black text-gray-900">
              {formatAmount(amount)}
            </p>
            {transactionId && (
              <p className="text-xs text-gray-400 mt-2">ID: {transactionId}</p>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <Loader2
                size={48}
                className="animate-spin text-blue-500 mx-auto mb-4"
              />
              <p className="text-gray-600 font-medium">
                Menyiapkan pembayaran...
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Popup QRIS akan muncul sebentar lagi
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Terjadi Kesalahan
              </h3>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={initiatePayment}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          {/* Ready State - Snap popup is open */}
          {!isLoading && !error && (
            <div className="text-center py-4">
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <h4 className="font-bold text-blue-800 text-sm mb-2">
                  Cara Pembayaran:
                </h4>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside text-left">
                  <li>Popup pembayaran Midtrans akan terbuka</li>
                  <li>Scan QR Code yang muncul dengan e-wallet Anda</li>
                  <li>Konfirmasi pembayaran di aplikasi e-wallet</li>
                  <li>Tunggu hingga pembayaran berhasil</li>
                </ol>
              </div>

              <p className="text-gray-500 text-sm mb-4">
                Jika popup tidak muncul, klik tombol di bawah:
              </p>

              <button
                onClick={initiatePayment}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <QrCode size={18} />
                Buka Pembayaran QRIS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrisPaymentModal;
