import React, { useState, useEffect, useRef } from "react";
import { CartItem, PaymentMethod, OrderPayload, Product } from "../types";
import {
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  X,
  Loader2,
  Heart,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  ShoppingBag,
  ReceiptText,
} from "lucide-react";
import { submitOrder, getProducts } from "../services/api";
import { getDisplayImageUrl } from "../utils/format";

interface OrderPanelProps {
  cart: CartItem[];
  orderType: string;
  setOrderType: (type: string) => void;
  onUpdateQty: (id: string, delta: number, uniqueKey: string) => void;
  onUpdatePrice: (id: string, newPrice: number, uniqueKey: string) => void;
  onRemove: (uniqueKey: string) => void;
  onClear: () => void;
  onClose?: () => void;
}

const OrderPanel: React.FC<OrderPanelProps> = ({
  cart,
  orderType,
  setOrderType,
  onUpdateQty,
  onUpdatePrice,
  onRemove,
  onClear,
  onClose,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.TUNAI
  );
  const [cashReceived, setCashReceived] = useState<string>("");
  const [debtorName, setDebtorName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isDonationEnabled, setIsDonationEnabled] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>("Table 1");

  const scrollEndRef = useRef<HTMLDivElement>(null);

  const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  const cashValue = parseInt(cashReceived.replace(/\./g, "") || "0", 10);
  const change = cashValue - total;

  const tableOptions = Array.from({ length: 20 }, (_, i) => `Table ${i + 1}`);

  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [cart.length]);

  const handleCashInput = (val: string) => {
    const num = val.replace(/\D/g, "");
    setCashReceived(num ? fmt(parseInt(num, 10)) : "");
  };

  const handleDonateChange = async () => {
    if (change <= 0) return;
    const allProducts = await getProducts();
    const donationItem = allProducts.find(
      (p) => p.category.toLowerCase() === "donasi"
    );

    if (donationItem) {
      window.dispatchEvent(
        new CustomEvent("add-to-cart-flexible", {
          detail: { product: donationItem, price: change },
        })
      );
      setCashReceived(fmt(total));
    } else {
      alert("Item Donasi tidak ditemukan.");
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === PaymentMethod.TUNAI && cashValue < total) {
      alert("Uang tunai tidak cukup!");
      return;
    }
    if (paymentMethod === PaymentMethod.PIUTANG && !debtorName.trim()) {
      alert("Nama penghutang wajib diisi!");
      return;
    }

    setIsProcessing(true);
    const generatedId = `TRX-${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")}`;

    // Logika Alokasi Per Item
    const itemsWithAllocation = cart.map((c) => {
      let allocation = "Umum";
      if (c.category.toLowerCase() === "donasi") {
        allocation = "Dana Sosial";
      } else {
        // Alokasi mengikuti metode bayar utama jika bukan donasi
        allocation =
          paymentMethod === PaymentMethod.TUNAI
            ? "Saldo Tunai"
            : paymentMethod === PaymentMethod.QRIS
            ? "Saldo QRIS"
            : `Piutang: ${debtorName}`;
      }

      return {
        id: c.id,
        name: c.name,
        qty: c.qty,
        price: c.price,
        note: c.note || "",
        allocation: allocation,
      };
    });

    const payload: OrderPayload = {
      orderId: generatedId,
      tableNumber: selectedTable,
      orderType: orderType,
      items: itemsWithAllocation,
      subtotal,
      tax,
      total,
      cashReceived: paymentMethod === PaymentMethod.TUNAI ? cashValue : total,
      change: paymentMethod === PaymentMethod.TUNAI ? Math.max(0, change) : 0,
      paymentMethod:
        paymentMethod === PaymentMethod.PIUTANG
          ? `Piutang: ${debtorName}`
          : paymentMethod,
      timestamp: new Date().toISOString(),
    };

    const result = await submitOrder(payload);
    setIsProcessing(false);
    if (result.success) {
      setShowSuccessToast(true);
    } else {
      alert("Gagal menyimpan transaksi.");
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-white flex flex-col shadow-2xl border-l border-gray-100 relative overflow-hidden">
      {showSuccessToast && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden p-6 text-center">
            <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold mb-1">Berhasil!</h3>
            <p className="text-xs text-gray-500 mb-6">
              {paymentMethod === PaymentMethod.PIUTANG
                ? `Piutang dicatat: ${debtorName}`
                : `Kembalian: ${fmtCurrency(Math.max(0, change))}`}
            </p>
            <button
              onClick={() => {
                setShowSuccessToast(false);
                onClear();
                setCashReceived("");
                setDebtorName("");
              }}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm"
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      <div className="p-4 md:p-6 border-b border-gray-100 flex-none bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Ringkasan Pesanan</h2>
          <button
            onClick={onClear}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 text-xs font-bold py-2.5 px-3 rounded-xl outline-none focus:ring-1 focus:ring-slate-900"
          >
            {tableOptions.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className={`flex-1 border text-xs font-bold py-2.5 px-3 rounded-xl transition-all outline-none ${
              orderType === "Take Away"
                ? "bg-amber-500 text-white border-amber-600"
                : "bg-gray-50 text-gray-700 border-gray-200"
            }`}
          >
            <option value="Dine In">Dine In</option>
            <option value="Take Away">Take Away</option>
          </select>
        </div>
      </div>

      {/* Scrollable Cart Items */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-4 space-y-3 bg-gray-50/30">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 opacity-30 text-center">
            <ShoppingBag size={40} className="mb-3 text-gray-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Keranjang Kosong
            </p>
          </div>
        ) : (
          cart.map((item, idx) => {
            const uniqueKey = `${item.id}-${item.price}`;
            const isDonation = item.category.toLowerCase() === "donasi";

            return (
              <div
                key={idx}
                className={`flex gap-3 p-3 bg-white rounded-2xl border transition-all ${
                  isDonation
                    ? "border-amber-200 bg-amber-50/30 shadow-sm"
                    : "border-gray-100 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="relative flex-none">
                  <img
                    src={getDisplayImageUrl(item.image)}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <button
                    onClick={() => onRemove(uniqueKey)}
                    className="absolute -top-1.5 -left-1.5 p-1 bg-white border border-gray-100 text-red-500 rounded-full shadow-lg hover:bg-red-50 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-[11px] font-black text-slate-800 truncate leading-tight pr-2">
                      {item.name}
                    </h4>
                    <span className="text-[11px] font-black text-slate-900">
                      {fmt(item.price * item.qty)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {isDonation ? (
                      <input
                        type="text"
                        value={fmt(item.price)}
                        onChange={(e) => {
                          const val =
                            parseInt(e.target.value.replace(/\D/g, "")) || 0;
                          onUpdatePrice(item.id, val, uniqueKey);
                        }}
                        className="flex-1 bg-white border border-amber-200 rounded-lg py-1 px-2 text-[10px] font-black text-right outline-none focus:ring-1 focus:ring-amber-500 text-amber-600"
                        placeholder="Nilai Donasi..."
                      />
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => onUpdateQty(item.id, -1, uniqueKey)}
                          className="p-1 bg-gray-100 rounded-lg text-gray-400 hover:bg-gray-200 transition-colors"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-black w-4 text-center text-slate-800">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => onUpdateQty(item.id, 1, uniqueKey)}
                          className="p-1 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    )}
                    {!isDonation && (
                      <span className="text-[9px] text-gray-400 font-bold">
                        @ {fmt(item.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 pb-2 bg-white border-t border-gray-100">
        <div className="space-y-2.5 mb-6">
          <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Subtotal</span>
            <span>{fmtCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Pajak Resto (10%)</span>
            <span>{fmtCurrency(tax)}</span>
          </div>
          <div className="h-px bg-gray-50 my-2"></div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-black text-slate-800 flex items-center gap-2">
              Total Tagihan
            </span>
            <span className="text-xl font-black text-emerald-600">
              {fmtCurrency(total)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setPaymentMethod(PaymentMethod.TUNAI)}
            className={`flex flex-col items-center py-2.5 rounded-2xl border transition-all ${
              paymentMethod === PaymentMethod.TUNAI
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                : "border-gray-100 text-gray-400 hover:bg-gray-50"
            }`}
          >
            <Banknote size={18} />
            <span className="text-[10px] mt-1 font-black uppercase">Tunai</span>
          </button>
          <button
            onClick={() => setPaymentMethod(PaymentMethod.PIUTANG)}
            className={`flex flex-col items-center py-2.5 rounded-2xl border transition-all ${
              paymentMethod === PaymentMethod.PIUTANG
                ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                : "border-gray-100 text-gray-400 hover:bg-gray-50"
            }`}
          >
            <UserPlus size={18} />
            <span className="text-[10px] mt-1 font-black uppercase">
              Piutang
            </span>
          </button>
          <button
            onClick={() => setPaymentMethod(PaymentMethod.QRIS)}
            className={`flex flex-col items-center py-2.5 rounded-2xl border transition-all ${
              paymentMethod === PaymentMethod.QRIS
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                : "border-gray-100 text-gray-400 hover:bg-gray-50"
            }`}
          >
            <QrCode size={18} />
            <span className="text-[10px] mt-1 font-black uppercase">QRIS</span>
          </button>
        </div>

        {paymentMethod === PaymentMethod.PIUTANG && (
          <div className="mb-4">
            <input
              type="text"
              value={debtorName}
              onChange={(e) => setDebtorName(e.target.value)}
              placeholder="Nama Penghutang..."
              className="w-full bg-amber-50 border border-amber-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>
        )}

        {paymentMethod === PaymentMethod.TUNAI && (
          <div className="mb-4">
            <input
              type="text"
              value={cashReceived}
              onChange={(e) => handleCashInput(e.target.value)}
              placeholder="Uang Diterima..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-right font-black text-xl mb-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {change > 0 && (
              <button
                onClick={handleDonateChange}
                className="w-full bg-rose-50 text-rose-600 py-3 rounded-2xl text-[10px] font-black uppercase border border-rose-100 flex items-center justify-center gap-2"
              >
                <Heart size={14} fill="currentColor" /> Donasikan Kembalian{" "}
                {fmt(change)}?
              </button>
            )}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={isProcessing || cart.length === 0}
          className="w-full py-4 rounded-2xl font-black text-xs uppercase bg-slate-900 text-white shadow-lg active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          Check Out
        </button>
      </div>
    </div>
  );
};

export default OrderPanel;
