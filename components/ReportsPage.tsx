import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  Printer,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  CreditCard,
  Save,
  ShoppingBag,
  User,
  AlertTriangle,
} from "lucide-react";
import {
  getTransactions,
  getTransactionDetails,
  deleteTransaction,
  updateTransaction,
} from "../services/api";
import { TransactionRecord } from "../types";
import {
  radius,
  shadows,
  typography,
  buttonStyles,
  tableStyles,
  pageStyles,
  animations,
  modalStyles,
} from "../styles/design-system";

interface ReportsPageProps {
  onRefresh?: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ onRefresh }) => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");

  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [txDetails, setTxDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Custom Delete Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [idToPendingDelete, setIdToPendingDelete] = useState<string | null>(
    null
  );

  const [editForm, setEditForm] = useState({
    table: "",
    type: "",
    paymentBase: "",
    debtorName: "",
  });

  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  }>({
    show: false,
    msg: "",
    type: "success",
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data || []);
    } catch (err) {
      console.error("Fetch Transactions Error:", err);
      showToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  const handleView = async (tx: TransactionRecord) => {
    setSelectedTx(tx);
    setLoadingDetails(true);
    setIsEditing(false);
    setTxDetails([]);

    try {
      const details = await getTransactionDetails(tx.id);
      setTxDetails(details || []);
    } catch (err) {
      console.error("Error loading details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenEdit = (tx: TransactionRecord) => {
    setSelectedTx(tx);
    setIsEditing(true);

    let base = tx.paymentMethod || "Tunai";
    let debtor = "";

    if (base.includes("Piutang")) {
      if (base.includes(": ")) {
        debtor = base.split(": ")[1];
      } else {
        const match = base.match(/\(([^)]+)\)/);
        debtor = match ? match[1] : "";
      }
      base = "Piutang";
    }

    setEditForm({
      table: tx.tableNumber || "",
      type: tx.orderType || "Dine In",
      paymentBase: base === "Cash" ? "Tunai" : base,
      debtorName: debtor,
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedTx) return;
    setIsSaving(true);
    try {
      const finalPayment =
        editForm.paymentBase === "Piutang"
          ? `Piutang: ${editForm.debtorName || "Tanpa Nama"}`
          : editForm.paymentBase;

      const result = await updateTransaction({
        id: String(selectedTx.id),
        tableNumber: editForm.table,
        orderType: editForm.type,
        paymentMethod: finalPayment,
      });

      if (result && result.success) {
        showToast("Berhasil diperbarui");
        setIsEditing(false);
        setSelectedTx(null);
        await fetchData();
        if (onRefresh) onRefresh();
      } else {
        showToast(result?.message || "Gagal menyimpan", "error");
      }
    } catch (err) {
      showToast("Koneksi gagal", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setIdToPendingDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!idToPendingDelete) return;

    setDeletingId(idToPendingDelete);
    try {
      const res = await deleteTransaction(idToPendingDelete);
      if (res && res.success) {
        showToast("Data dihapus");
        setShowDeleteConfirm(false);
        setIdToPendingDelete(null);
        await fetchData();
        if (onRefresh) onRefresh();
      } else {
        showToast(res?.message || "Gagal menghapus", "error");
      }
    } catch (err) {
      showToast("Koneksi ke server gagal", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrint = (tx: TransactionRecord, items: any[]) => {
    const printArea = document.getElementById("print-area");
    if (!printArea) return;

    printArea.innerHTML = `
      <div style="text-align: center; margin-bottom: 10px; font-family: sans-serif;">
        <h2 style="margin: 0; font-size: 16px;">FOODCOURT POS</h2>
        <p style="font-size: 10px; margin: 0;">Nota Transaksi</p>
      </div>
      <div style="border-bottom: 1px dashed black; margin-bottom: 10px;"></div>
      <div style="font-size: 10px; margin-bottom: 10px; font-family: monospace;">
        <p style="margin: 2px 0;">ID: ${tx.id}</p>
        <p style="margin: 2px 0;">Meja: ${tx.tableNumber} / ${tx.orderType}</p>
        <p style="margin: 2px 0;">Bayar: ${tx.paymentMethod}</p>
        <p style="margin: 2px 0;">Kasir: ${tx.cashier}</p>
      </div>
      <div style="border-bottom: 1px dashed black; margin-bottom: 10px;"></div>
      <table style="width: 100%; font-size: 10px; border-collapse: collapse; font-family: monospace;">
        ${items
          .map(
            (item) => `
          <tr><td style="padding: 2px 0;">${item.name}</td></tr>
          <tr>
            <td style="padding: 0 0 4px 0; color: #666;">${fmt(item.price)} x ${
              item.qty
            }</td>
            <td style="text-align: right; padding: 0 0 4px 0;">${fmt(
              item.price * item.qty
            )}</td>
          </tr>
        `
          )
          .join("")}
      </table>
      <div style="border-top: 1px dashed black; margin-top: 10px; padding-top: 5px; font-family: monospace;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold;">
          <span>TOTAL</span>
          <span>${fmt(tx.total)}</span>
        </div>
      </div>
    `;
    window.print();
  };

  const filteredTxs = transactions.filter(
    (t) =>
      (t.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.tableNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.paymentMethod || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-gray-50 h-screen overflow-y-auto custom-scroll p-4 lg:p-8 animate-in fade-in duration-500 relative">
      {/* Custom Delete Confirmation Pop-up */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">
              Hapus Transaksi?
            </h3>
            <p className="text-xs text-gray-400 font-medium mb-8 leading-relaxed px-4">
              Apakah Anda yakin ingin menghapus transaksi{" "}
              <span className="text-slate-900 font-bold">
                #{idToPendingDelete}
              </span>{" "}
              secara permanen dari database?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={!!deletingId}
                className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={!!deletingId}
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
              >
                {deletingId ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div
          className={`fixed top-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-10 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={24} />
          ) : (
            <AlertCircle size={24} />
          )}
          <div>
            <span className="font-bold text-sm block">
              {toast.type === "success" ? "Berhasil" : "Kesalahan"}
            </span>
            <span className="text-xs opacity-90">{toast.msg}</span>
          </div>
        </div>
      )}

      <div className={pageStyles.header}>
        <div>
          <h1 className={`${typography.h1} text-gray-800`}>
            Laporan Penjualan
          </h1>
          <p className={`${typography.caption} mt-1`}>Histori Transaksi</p>
        </div>
        <button
          onClick={fetchData}
          className="p-3 bg-white text-gray-400 rounded-xl hover:text-emerald-500 transition-all shadow-sm"
        >
          <Loader2 size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <input
            type="text"
            placeholder="Cari No. Resi, Meja, atau Nama Piutang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
        <div className="flex gap-2">
          {["Semua", "Dine In", "Take Away"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === f
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-5">No. Resi</th>
                <th className="px-6 py-5">Waktu</th>
                <th className="px-6 py-5">Tipe / Meja</th>
                <th className="px-6 py-5">Metode</th>
                <th className="px-6 py-5 text-right">Total</th>
                <th className="px-6 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <Loader2 className="animate-spin mx-auto mb-2 text-emerald-500" />
                  </td>
                </tr>
              ) : filteredTxs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-20 text-gray-400 text-sm"
                  >
                    Tidak ada transaksi.
                  </td>
                </tr>
              ) : (
                filteredTxs
                  .filter(
                    (t) =>
                      activeFilter === "Semua" || t.orderType === activeFilter
                  )
                  .map((t, idx) => (
                    <tr
                      key={t.id || idx}
                      className="hover:bg-gray-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-800">
                          {t.id}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {t.cashier}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-gray-300" />
                          {new Date(t.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-gray-300" />
                          <span className="text-xs font-bold text-gray-700">
                            {t.orderType} - {t.tableNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            t.paymentMethod?.includes("Piutang")
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}
                        >
                          <CreditCard size={10} />{" "}
                          {t.paymentMethod === "Cash"
                            ? "Tunai"
                            : t.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-emerald-600">
                          {fmtCurrency(t.total)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(t)}
                            title="Detail"
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(t)}
                            title="Ubah"
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(t.id)}
                            title="Hapus"
                            disabled={deletingId === t.id}
                            className={`p-2 rounded-lg transition-all ${
                              deletingId === t.id
                                ? "text-gray-300 bg-gray-50"
                                : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                            }`}
                          >
                            {deletingId === t.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${
                    isEditing
                      ? "bg-blue-50 text-blue-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {isEditing ? <Edit2 size={20} /> : <Eye size={20} />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {isEditing ? "Ubah Data" : "Informasi Nota"}
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    #{selectedTx.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll p-8">
              {isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                        Meja
                      </label>
                      <input
                        type="text"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold"
                        value={editForm.table}
                        onChange={(e) =>
                          setEditForm({ ...editForm, table: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                        Tipe
                      </label>
                      <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold"
                        value={editForm.type}
                        onChange={(e) =>
                          setEditForm({ ...editForm, type: e.target.value })
                        }
                      >
                        <option value="Dine In">Dine In</option>
                        <option value="Take Away">Take Away</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                      Metode Pembayaran
                    </label>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold mb-4"
                      value={editForm.paymentBase}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          paymentBase: e.target.value,
                        })
                      }
                    >
                      <option value="Tunai">Tunai</option>
                      <option value="Piutang">Piutang</option>
                      <option value="QRIS">QRIS</option>
                    </select>

                    {editForm.paymentBase === "Piutang" && (
                      <div className="animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-2 px-1">
                          Nama Penghutang
                        </label>
                        <div className="relative">
                          <User
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                          />
                          <input
                            type="text"
                            className="w-full bg-amber-50 border border-amber-100 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Masukkan nama..."
                            value={editForm.debtorName}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                debtorName: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-900 rounded-[32px] p-8 mb-8 text-center border-4 border-emerald-500/20 shadow-xl">
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] mb-4">
                      Transaksi Selesai
                    </p>
                    <h3 className="text-4xl font-black text-white">
                      {fmtCurrency(selectedTx.total)}
                    </h3>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                      <CreditCard size={12} />{" "}
                      {selectedTx.paymentMethod === "Cash"
                        ? "Tunai"
                        : selectedTx.paymentMethod}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-emerald-500" />
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Detail Pesanan
                      </h4>
                    </div>
                    <div className="bg-gray-50 rounded-3xl p-5 space-y-4 border border-gray-100">
                      {loadingDetails ? (
                        <Loader2
                          size={24}
                          className="animate-spin text-emerald-500 mx-auto"
                        />
                      ) : (
                        txDetails.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-800 leading-tight">
                                {item.name}
                              </p>
                              <span className="text-[10px] font-black text-emerald-600">
                                {item.qty} pcs @ {fmt(item.price)}
                              </span>
                            </div>
                            <p className="text-sm font-black text-gray-900 ml-4">
                              {fmtCurrency(item.price * item.qty)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-widest"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="flex-[2] flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}{" "}
                    Simpan Perubahan
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handlePrint(selectedTx, txDetails)}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all"
                >
                  <Printer size={18} /> Cetak Nota
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
