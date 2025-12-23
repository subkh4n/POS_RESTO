import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  ShoppingCart,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import OrderPanel from "../components/OrderPanel";
import { Product, CartItem } from "../types";
import {
  radius,
  shadows,
  typography,
  buttonStyles,
  inputStyles,
} from "../styles/design-system";

interface POSViewProps {
  products: Product[];
  categories: { name: string }[];
  isLoading: boolean;
  cart: CartItem[];
  orderType: string;
  setOrderType: (type: string) => void;
  addToCart: (product: Product, price?: number) => void;
  updateQty: (id: string, delta: number, key?: string) => void;
  updatePrice: (id: string, price: number, key: string) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  onRefresh: () => void;
}

const ITEMS_PER_PAGE = 15;

const POSView: React.FC<POSViewProps> = ({
  products,
  categories,
  isLoading,
  cart,
  orderType,
  setOrderType,
  addToCart,
  updateQty,
  updatePrice,
  removeItem,
  clearCart,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Menu");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      activeCategory === "All Menu" || p.category === activeCategory;
    const matchesSearch = (p.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden bg-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="px-4 lg:px-8 pt-6 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center flex-none gap-4">
          <div>
            <h1 className={`${typography.h2} text-gray-800`}>Foodcourt POS</h1>
            <p className={typography.caption}>
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>

          <div
            className={`bg-gray-50 p-1.5 ${radius.lg} border border-gray-100 flex items-center gap-2 w-full sm:w-64`}
          >
            <Search size={16} className="text-gray-400 ml-2" />
            <input
              type="text"
              placeholder="Cari menu..."
              className="bg-transparent outline-none text-sm w-full py-2 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Categories Horizontal Scroll */}
        <div className="px-4 lg:px-8 mb-4 overflow-x-auto scrollbar-hide flex-none">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-tighter whitespace-nowrap transition-all
                  ${
                    activeCategory === cat.name
                      ? "bg-slate-900 text-white shadow-lg"
                      : "bg-white text-gray-400 hover:bg-gray-100 border border-gray-100"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto custom-scroll px-4 lg:px-8 pb-4">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
              <Loader2 className="animate-spin text-slate-900" size={32} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Sinkronisasi Menu...
              </span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-300">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-bold">Produk tidak ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in duration-500">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination Navigation Bar */}
        {!isLoading && filteredProducts.length > 0 && totalPages > 1 && (
          <div className="px-4 lg:px-8 py-3 border-t border-gray-100 bg-white flex-none">
            <div className="flex items-center justify-between">
              {/* Info */}
              <div className="text-xs text-gray-500 hidden sm:block">
                Menampilkan {startIndex + 1}-
                {Math.min(endIndex, filteredProducts.length)} dari{" "}
                {filteredProducts.length} produk
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1 mx-auto sm:mx-0">
                {/* Previous Button */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first, last, current, and nearby pages
                      if (totalPages <= 5) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, arr) => (
                      <React.Fragment key={page}>
                        {/* Add ellipsis if there's a gap */}
                        {index > 0 && page - arr[index - 1] > 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${
                            currentPage === page
                              ? "bg-slate-900 text-white shadow-md"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Spacer for mobile cart button */}
        <div className="h-16 md:hidden flex-none"></div>

        {/* Mobile Cart Floating Action Button */}
        {cartCount > 0 && (
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="md:hidden fixed bottom-20 right-4 bg-slate-900 text-white p-4 rounded-full shadow-2xl z-50 animate-bounce flex items-center gap-2"
          >
            <div className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {cartCount}
              </span>
            </div>
            <span className="text-sm font-bold pr-2">Cek Keranjang</span>
          </button>
        )}
      </div>

      {/* Cart Panel (Drawer on Mobile, Sidebar on Desktop) */}
      <div
        className={`
        fixed inset-0 z-[200] transition-all duration-500 ease-in-out bg-slate-900/40 backdrop-blur-sm
        md:relative md:inset-auto md:bg-transparent md:backdrop-blur-none md:z-10
        ${
          isMobileCartOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible md:opacity-100 md:visible"
        }
      `}
      >
        <div
          className={`
          absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl transition-transform duration-500
          md:relative md:max-w-none md:w-80 lg:w-96 md:translate-x-0
          ${isMobileCartOpen ? "translate-x-0" : "translate-x-full"}
        `}
        >
          <div className="md:hidden absolute top-4 left-[-3rem]">
            <button
              onClick={() => setIsMobileCartOpen(false)}
              className="p-3 bg-white rounded-full text-slate-900 shadow-xl"
            >
              <X size={24} />
            </button>
          </div>
          <OrderPanel
            cart={cart}
            orderType={orderType}
            setOrderType={setOrderType}
            onUpdateQty={updateQty}
            onUpdatePrice={updatePrice}
            onRemove={removeItem}
            onClear={() => {
              clearCart();
              setIsMobileCartOpen(false);
              onRefresh();
            }}
            onClose={() => setIsMobileCartOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default POSView;
