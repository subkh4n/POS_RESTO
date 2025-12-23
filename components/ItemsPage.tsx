import React, { useState, useRef, useMemo } from "react";
import {
  Plus,
  Image as ImageIcon,
  Save,
  X,
  Loader2,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Package2,
  Briefcase,
  Zap,
  ChevronRight,
  ChevronLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Minus,
} from "lucide-react";
import {
  addProduct,
  uploadImage,
  updateProduct,
  deleteProduct,
  adjustStock,
} from "../services/api";
import { Product } from "../types";
import { getDisplayImageUrl } from "../utils/format";
import {
  radius,
  shadows,
  typography,
  buttonStyles,
  inputStyles,
  tableStyles,
  pageStyles,
  animations,
} from "../styles/design-system";

type ItemsSubView = "list" | "add";

interface ItemsPageProps {
  products: Product[];
  categories: { name: string }[];
  onRefresh: () => void;
}

const ItemsPage: React.FC<ItemsPageProps> = ({
  products,
  categories,
  onRefresh,
}) => {
  const [subView, setSubView] = useState<ItemsSubView>("list");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stockAdjustQty, setStockAdjustQty] = useState<number>(0);
  const [stockActionType, setStockActionType] = useState<
    "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT"
  >("STOCK_IN");
  const [stockNotes, setStockNotes] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  }>({
    show: false,
    msg: "",
    type: "success",
  });

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: 0,
    stockType: "STOK_FISIK" as "STOK_FISIK" | "NON_STOK" | "JASA",
    price: 0,
    sku: "",
    available: true,
    image: "",
    preview: "",
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setFormData((prev) => ({ ...prev, preview: base64 }));
        const result = await uploadImage(base64, file.name);
        if (result.success && result.url) {
          setFormData((prev) => ({ ...prev, image: result.url! }));
          showToast("✅ Gambar berhasil diupload ke Drive!");
        } else {
          showToast(result.message || "Gagal upload gambar", "error");
        }
        setIsUploading(false);
      };
    } catch (err) {
      showToast("Gagal memproses gambar", "error");
      setIsUploading(false);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setStockAdjustQty(0);
    setStockActionType("STOCK_IN");
    setStockNotes("");
    setFormData({
      name: p.name,
      category: p.category,
      stock: p.stock,
      stockType: p.stockType || "STOK_FISIK",
      price: p.price,
      sku: p.id,
      available: p.available,
      image: p.image,
      preview: getDisplayImageUrl(p.image),
    });
    setSubView("add");
  };

  const handleSave = async () => {
    if (!formData.name) {
      showToast("Nama produk wajib diisi", "error");
      return;
    }
    setIsSaving(true);

    // For new products, use provided stock directly
    // For existing products, stock adjustments are handled separately via adjustStock API
    const finalStock = formData.stockType === "STOK_FISIK" ? formData.stock : 0;

    const payload: Partial<Product> = {
      id:
        editingId ||
        formData.sku ||
        `ITEM-${Math.floor(Math.random() * 100000)}`,
      name: formData.name,
      category: formData.category,
      stock: finalStock,
      stockType: formData.stockType,
      price: formData.price,
      available: formData.available,
      image: formData.image,
    };

    try {
      // Save product data first
      const result = editingId
        ? await updateProduct(payload)
        : await addProduct(payload);

      if (!result.success) {
        showToast(result.message || "Gagal menyimpan", "error");
        setIsSaving(false);
        return;
      }

      // If editing and there's a stock adjustment, apply it
      if (
        editingId &&
        formData.stockType === "STOK_FISIK" &&
        stockAdjustQty !== 0
      ) {
        const stockResult = await adjustStock(
          editingId,
          stockActionType === "ADJUSTMENT"
            ? stockAdjustQty
            : Math.abs(stockAdjustQty),
          stockActionType,
          stockNotes ||
            `${
              stockActionType === "STOCK_IN"
                ? "Tambah"
                : stockActionType === "STOCK_OUT"
                ? "Kurang"
                : "Sesuaikan"
            } stok via Item Management`
        );

        if (!stockResult.success) {
          showToast(
            `Produk tersimpan, tapi gagal adjust stok: ${stockResult.message}`,
            "error"
          );
          setSubView("list");
          onRefresh();
          return;
        }
      }

      showToast("Produk berhasil disimpan");
      setSubView("list");
      onRefresh();
    } catch (e) {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeletingId(productToDelete.id);
    try {
      const result = await deleteProduct(productToDelete.id);
      if (result.success) {
        showToast("Produk berhasil dihapus");
        setShowDeleteModal(false);
        setProductToDelete(null);
        onRefresh();
      }
    } catch (err) {
      showToast("Gagal menghapus data", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const renderListView = () => (
    <div className={animations.slideUp}>
      <div className={pageStyles.header + " px-2"}>
        <div>
          <h1 className={`${typography.h1} text-slate-900`}>
            Inventori Produk
          </h1>
          <p className={`${typography.caption} mt-1`}>Manajemen Menu & Stok</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setStockAdjustQty(0);
            setStockActionType("STOCK_IN");
            setStockNotes("");
            setFormData({
              name: "",
              category: categories[0]?.name || "Food",
              stock: 0,
              stockType: "STOK_FISIK",
              price: 0,
              sku: "",
              available: true,
              image: "",
              preview: "",
            });
            setSubView("add");
          }}
          className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
        >
          <Plus size={18} /> Tambah Menu
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-6 flex gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari menu atau SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-2xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
        <button
          onClick={onRefresh}
          className="p-3 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 transition-all"
        >
          <Loader2 size={18} className={isSaving ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                <th className="px-8 py-6">Item</th>
                <th className="px-8 py-6">Kategori</th>
                <th className="px-8 py-6">Sisa Stok / Status</th>
                <th className="px-8 py-6">Metode</th>
                <th className="px-8 py-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(() => {
                const filteredProducts = products.filter((p) =>
                  p.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                const totalPages = Math.ceil(
                  filteredProducts.length / ITEMS_PER_PAGE
                );
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                const paginatedProducts = filteredProducts.slice(
                  startIndex,
                  startIndex + ITEMS_PER_PAGE
                );

                return paginatedProducts.map((p, idx) => {
                  const isDonation = p.category.toLowerCase() === "donasi";
                  const isPhysical = p.stockType === "STOK_FISIK";

                  return (
                    <tr
                      key={p.id || idx}
                      className={`hover:bg-gray-50/30 transition-colors ${
                        !p.available ? "opacity-60 grayscale" : ""
                      }`}
                    >
                      <td className="px-8 py-5 flex items-center gap-4">
                        <img
                          src={getDisplayImageUrl(p.image)}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover bg-gray-100"
                        />
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-none mb-1">
                            {p.name}
                          </p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">
                            SKU: {p.id}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                            isDonation
                              ? "bg-amber-100 text-amber-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        {isPhysical ? (
                          <div className="flex flex-col">
                            <span
                              className={`text-xs font-black ${
                                p.stock <= 0
                                  ? "text-rose-600"
                                  : p.stock < 10
                                  ? "text-amber-500"
                                  : "text-emerald-600"
                              }`}
                            >
                              Sisa: {p.stock} pcs
                            </span>
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className={`h-full ${
                                  p.stock <= 0
                                    ? "bg-rose-500"
                                    : p.stock < 10
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(p.stock, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                p.available
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                  : "bg-rose-50 text-rose-600 border-rose-200"
                              }`}
                            >
                              {p.available
                                ? "● ON (MELAYANI)"
                                : "○ OFF (TUTUP)"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          {p.stockType === "STOK_FISIK" ? (
                            <Package2 size={14} className="text-emerald-500" />
                          ) : p.stockType === "JASA" ? (
                            <Briefcase size={14} className="text-blue-500" />
                          ) : (
                            <Zap size={14} className="text-amber-500" />
                          )}
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            {p.stockType.replace("_", " ")}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete(p);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {(() => {
          const filteredProducts = products.filter((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          const totalPages = Math.ceil(
            filteredProducts.length / ITEMS_PER_PAGE
          );
          const totalItems = filteredProducts.length;
          const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
          const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

          if (totalPages <= 1) return null;

          return (
            <div className="flex items-center justify-between px-8 py-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium">
                Menampilkan{" "}
                <span className="font-bold text-slate-900">
                  {startItem}-{endItem}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-slate-900">{totalItems}</span>{" "}
                produk
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                        currentPage === page
                          ? "bg-slate-900 text-white shadow-lg"
                          : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );

  const renderAddView = () => {
    const isDonation = formData.category.toLowerCase() === "donasi";
    return (
      <div className="animate-in slide-in-from-right-8 duration-500 max-w-4xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-8 px-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {editingId ? "Edit Item" : "Tambah Menu"}
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase mt-1">
              Konfigurasi produk
            </p>
          </div>
          <button
            onClick={() => setSubView("list")}
            className="p-3 bg-white border border-gray-100 text-gray-400 rounded-2xl"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm flex flex-col items-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square rounded-[32px] border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
              >
                {formData.preview ? (
                  <img
                    src={
                      formData.preview.startsWith("data:")
                        ? formData.preview
                        : getDisplayImageUrl(formData.preview)
                    }
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={48} className="text-gray-200" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="w-full mt-6 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-gray-400">
                    Status Penjualan
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase ${
                      formData.available ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {formData.available ? "Aktif" : "Tutup"}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setFormData({ ...formData, available: !formData.available })
                  }
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                    formData.available
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <span className="text-xs font-black uppercase">
                    Bisa Order
                  </span>
                  {formData.available ? (
                    <ToggleRight size={28} />
                  ) : (
                    <ToggleLeft size={28} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 px-1">
                  Nama Produk
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 border-transparent rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 px-1">
                    Kategori
                  </label>
                  <select
                    className="w-full bg-gray-50 border-transparent rounded-2xl py-4 px-6 text-sm font-bold outline-none"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!isDonation && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 px-1">
                      Harga Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-gray-50 border-transparent rounded-2xl py-4 px-6 text-sm font-black outline-none"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "STOK_FISIK", icon: Package2 },
                  { id: "NON_STOK", icon: Zap },
                  { id: "JASA", icon: Briefcase },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() =>
                      setFormData({ ...formData, stockType: st.id as any })
                    }
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all flex flex-col items-center gap-2 ${
                      formData.stockType === st.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-gray-400 border-gray-100"
                    }`}
                  >
                    <st.icon size={18} />
                    {st.id.replace("_", " ")}
                  </button>
                ))}
              </div>

              {formData.stockType === "STOK_FISIK" && (
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-3xl border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Penyesuaian Stok
                    </h3>
                    <span className="text-[10px] font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-gray-100">
                      Saat ini: {formData.stock} pcs
                    </span>
                  </div>

                  {/* Action Type Buttons */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <button
                      onClick={() => {
                        setStockActionType("STOCK_IN");
                        setStockAdjustQty(Math.abs(stockAdjustQty));
                      }}
                      className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase flex flex-col items-center gap-1.5 transition-all border ${
                        stockActionType === "STOCK_IN"
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100"
                          : "bg-white text-gray-400 border-gray-100 hover:border-emerald-200"
                      }`}
                    >
                      <ArrowUpCircle size={18} />
                      Stok Masuk
                    </button>
                    <button
                      onClick={() => {
                        setStockActionType("STOCK_OUT");
                        setStockAdjustQty(Math.abs(stockAdjustQty));
                      }}
                      className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase flex flex-col items-center gap-1.5 transition-all border ${
                        stockActionType === "STOCK_OUT"
                          ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-100"
                          : "bg-white text-gray-400 border-gray-100 hover:border-rose-200"
                      }`}
                    >
                      <ArrowDownCircle size={18} />
                      Stok Keluar
                    </button>
                    <button
                      onClick={() => setStockActionType("ADJUSTMENT")}
                      className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase flex flex-col items-center gap-1.5 transition-all border ${
                        stockActionType === "ADJUSTMENT"
                          ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-100"
                          : "bg-white text-gray-400 border-gray-100 hover:border-blue-200"
                      }`}
                    >
                      <RefreshCw size={18} />
                      Adjustment
                    </button>
                  </div>

                  {/* Quantity Input */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 mb-4">
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">
                      {stockActionType === "ADJUSTMENT"
                        ? "Stok Baru"
                        : "Jumlah"}
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setStockAdjustQty(Math.max(0, stockAdjustQty - 1))
                        }
                        className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-slate-900 transition-all"
                      >
                        <Minus size={20} />
                      </button>
                      <input
                        type="number"
                        className="flex-1 text-center bg-gray-50 rounded-xl py-3 text-xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                        value={stockAdjustQty || ""}
                        onChange={(e) =>
                          setStockAdjustQty(parseInt(e.target.value) || 0)
                        }
                        min={0}
                      />
                      <button
                        onClick={() => setStockAdjustQty(stockAdjustQty + 1)}
                        className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-slate-900 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  {stockAdjustQty !== 0 && (
                    <div
                      className={`p-4 rounded-2xl mb-4 text-center ${
                        stockActionType === "STOCK_IN"
                          ? "bg-emerald-50 border border-emerald-100"
                          : stockActionType === "STOCK_OUT"
                          ? "bg-rose-50 border border-rose-100"
                          : "bg-blue-50 border border-blue-100"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase text-gray-500">
                        Stok Akhir:{" "}
                      </span>
                      <span
                        className={`text-lg font-black ${
                          stockActionType === "STOCK_IN"
                            ? "text-emerald-600"
                            : stockActionType === "STOCK_OUT"
                            ? "text-rose-600"
                            : "text-blue-600"
                        }`}
                      >
                        {stockActionType === "ADJUSTMENT"
                          ? stockAdjustQty
                          : stockActionType === "STOCK_IN"
                          ? formData.stock + stockAdjustQty
                          : Math.max(0, formData.stock - stockAdjustQty)}{" "}
                        pcs
                      </span>
                      <span
                        className={`text-xs font-bold ml-2 ${
                          stockActionType === "STOCK_IN"
                            ? "text-emerald-500"
                            : stockActionType === "STOCK_OUT"
                            ? "text-rose-500"
                            : "text-blue-500"
                        }`}
                      >
                        (
                        {stockActionType === "ADJUSTMENT"
                          ? (stockAdjustQty - formData.stock >= 0 ? "+" : "") +
                            (stockAdjustQty - formData.stock)
                          : stockActionType === "STOCK_IN"
                          ? "+" + stockAdjustQty
                          : "-" + stockAdjustQty}
                        )
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">
                      Catatan (Opsional)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-100 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 placeholder-gray-300"
                      placeholder="Contoh: Restok dari supplier, Produk expired, dll"
                      value={stockNotes}
                      onChange={(e) => setStockNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="pt-6 flex gap-4">
                <button
                  onClick={() => setSubView("list")}
                  className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isUploading}
                  className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-2xl flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}{" "}
                  Simpan Produk
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-gray-50 h-screen overflow-y-auto custom-scroll p-4 lg:p-8 relative">
      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-sm w-full p-10 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              Hapus Produk?
            </h3>
            <p className="text-xs text-gray-400 mb-8">
              Tindakan ini permanen. Produk{" "}
              <span className="text-slate-900 font-bold">
                "{productToDelete?.name}"
              </span>{" "}
              akan dihapus.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-[10px] uppercase"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-rose-100"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {toast.show && (
        <div
          className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest">
            {toast.msg}
          </span>
        </div>
      )}
      {subView === "list" ? renderListView() : renderAddView()}
    </div>
  );
};

export default ItemsPage;
