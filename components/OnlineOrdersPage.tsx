import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Bell,
  RefreshCw,
  Phone,
  User,
  CreditCard,
  Banknote,
  QrCode,
  AlertCircle,
  Loader2,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { GOOGLE_SCRIPT_URL } from "../constants";
import { useStore } from "../contexts/StoreContext";

interface OnlineOrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  note?: string;
}

interface OnlineOrder {
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OnlineOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  queueNumber: number;
  estimatedTime: number;
  notes: string;
  createdAt: string;
}

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: any }
> = {
  PENDING: {
    label: "Menunggu",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Dikonfirmasi",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: CheckCircle,
  },
  COOKING: {
    label: "Diproses",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    icon: ChefHat,
  },
  READY: {
    label: "Siap",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: Bell,
  },
  COMPLETED: {
    label: "Selesai",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: XCircle,
  },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> =
  {
    PENDING: { label: "Belum Bayar", color: "text-yellow-600 bg-yellow-100" },
    PAID: { label: "Lunas", color: "text-green-600 bg-green-100" },
    FAILED: { label: "Gagal", color: "text-red-600 bg-red-100" },
  };

const PAYMENT_METHOD_ICON: Record<string, any> = {
  COD: Banknote,
  QRIS: QrCode,
  TRANSFER: CreditCard,
};

const ITEMS_PER_PAGE = 10;

const OnlineOrdersPage: React.FC = () => {
  const { settings } = useStore();
  const printRef = useRef<HTMLDivElement>(null);

  // Dummy data untuk testing
  const DUMMY_ORDERS: OnlineOrder[] = [
    {
      orderId: "ONL-1234-1703847600000",
      customerId: "CUST-001",
      customerName: "Ahmad Sudirman",
      customerPhone: "081234567890",
      items: [
        {
          id: "1",
          name: "Nasi Goreng Special",
          qty: 2,
          price: 25000,
          note: "Pedas sedang",
        },
        { id: "2", name: "Ayam Bakar Madu", qty: 1, price: 30000 },
        { id: "5", name: "Es Teh Manis", qty: 3, price: 5000 },
      ],
      subtotal: 95000,
      tax: 9500,
      total: 104500,
      paymentMethod: "TRANSFER",
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
      queueNumber: 1,
      estimatedTime: 20,
      notes: "Tolong diantar ke meja depan pintu masuk",
      createdAt: new Date().toISOString(),
    },
    {
      orderId: "ONL-5678-1703847700000",
      customerId: "CUST-002",
      customerName: "Siti Rahayu",
      customerPhone: "087654321098",
      items: [
        { id: "3", name: "Cheese Burger", qty: 2, price: 35000 },
        { id: "5", name: "Es Teh Manis", qty: 2, price: 5000 },
      ],
      subtotal: 80000,
      tax: 8000,
      total: 88000,
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      orderStatus: "COOKING",
      queueNumber: 2,
      estimatedTime: 15,
      notes: "",
      createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    },
  ];

  const [orders, setOrders] = useState<OnlineOrder[]>(DUMMY_ORDERS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [useDummy, setUseDummy] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Print modal
  const [printOrder, setPrintOrder] = useState<OnlineOrder | null>(null);

  const fetchOrders = async () => {
    if (useDummy) return;

    setIsLoading(true);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getPendingOnlineOrders" }),
      });
      const data = await response.json();
      if (data.orders && data.orders.length > 0) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [useDummy]);

  // Local update for dummy data
  const updateLocalOrder = (orderId: string, updates: Partial<OnlineOrder>) => {
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, ...updates } : o))
    );
    if (selectedOrder?.orderId === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    orderStatus?: string,
    paymentStatus?: string
  ) => {
    setIsUpdating(true);

    if (useDummy) {
      setTimeout(() => {
        const updates: Partial<OnlineOrder> = {};
        if (orderStatus) updates.orderStatus = orderStatus;
        if (paymentStatus) updates.paymentStatus = paymentStatus;
        updateLocalOrder(orderId, updates);
        setIsUpdating(false);
        if (orderStatus === "COMPLETED" || orderStatus === "CANCELLED") {
          setSelectedOrder(null);
        }
      }, 500);
      return;
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "updateOrderStatus",
          orderId,
          orderStatus,
          paymentStatus,
        }),
      });
      const data = await response.json();
      if (data.success) {
        fetchOrders();
        setSelectedOrder(null);
      } else {
        alert("Gagal update status: " + data.message);
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      alert("Gagal update status pesanan");
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const flow: Record<string, string> = {
      PENDING: "CONFIRMED",
      CONFIRMED: "COOKING",
      COOKING: "READY",
      READY: "COMPLETED",
    };
    return flow[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: string): string => {
    const labels: Record<string, string> = {
      PENDING: "✓ Konfirmasi",
      CONFIRMED: "🍳 Masak",
      COOKING: "🔔 Siap",
      READY: "✓ Selesai",
    };
    return labels[currentStatus] || "Update";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.orderStatus !== statusFilter)
      return false;
    if (dateFilter && formatDate(order.createdAt) !== dateFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !order.customerName.toLowerCase().includes(query) &&
        !order.orderId.toLowerCase().includes(query) &&
        !order.customerPhone.includes(query)
      )
        return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Print function
  const handlePrint = (order: OnlineOrder) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Memuat pesanan online...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Pesanan Online
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredOrders.length} pesanan ditemukan
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Cari nama/ID/HP..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-48"
          />

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="CONFIRMED">Dikonfirmasi</option>
            <option value="COOKING">Diproses</option>
            <option value="READY">Siap</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {paginatedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <ShoppingBag size={64} className="mb-4 opacity-50" />
            <p className="text-lg">Tidak ada pesanan</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    No. Antrian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Pelanggan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Pembayaran
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Waktu
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedOrders.map((order) => {
                  const statusConfig =
                    ORDER_STATUS_CONFIG[order.orderStatus] ||
                    ORDER_STATUS_CONFIG.PENDING;
                  const paymentConfig =
                    PAYMENT_STATUS_CONFIG[order.paymentStatus] ||
                    PAYMENT_STATUS_CONFIG.PENDING;
                  const PaymentIcon =
                    PAYMENT_METHOD_ICON[order.paymentMethod] || CreditCard;

                  return (
                    <tr
                      key={order.orderId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 font-bold">
                          #{order.queueNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.customerPhone}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">
                          {order.items.length} item
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[150px]">
                          {order.items
                            .map((i) => `${i.qty}x ${i.name}`)
                            .join(", ")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">
                          {formatCurrency(order.total)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <PaymentIcon size={14} className="text-gray-400" />
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${paymentConfig.color}`}
                          >
                            {paymentConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
                        >
                          {React.createElement(statusConfig.icon, { size: 12 })}
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {/* View Button */}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </button>
                          {/* Print Button */}
                          <button
                            onClick={() => handlePrint(order)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Print untuk Dapur"
                          >
                            <Printer size={18} />
                          </button>
                          {/* Quick Action */}
                          {getNextStatus(order.orderStatus) && (
                            <button
                              onClick={() =>
                                updateOrderStatus(
                                  order.orderId,
                                  getNextStatus(order.orderStatus)!
                                )
                              }
                              disabled={isUpdating}
                              className="px-3 py-1.5 text-xs bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
                            >
                              {getNextStatusLabel(order.orderStatus)}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}{" "}
              dari {filteredOrders.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium ${
                      currentPage === page
                        ? "bg-cyan-500 text-white"
                        : "border border-gray-200 hover:bg-gray-50"
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
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div
              className={`${
                ORDER_STATUS_CONFIG[selectedOrder.orderStatus]?.bgColor ||
                "bg-slate-100"
              } px-6 py-4 flex items-center justify-between`}
            >
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-bold text-slate-800">
                  {selectedOrder.orderId}
                </p>
              </div>
              <div className="bg-white px-4 py-2 rounded-full text-slate-800 text-xl font-bold shadow-sm">
                #{selectedOrder.queueNumber}
              </div>
            </div>

            <div className="p-6">
              {/* Customer */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">
                  PELANGGAN
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {selectedOrder.customerName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedOrder.customerPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">
                  PESANAN
                </h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start py-2 border-b border-gray-100"
                    >
                      <div>
                        <p className="font-medium text-slate-700">
                          {item.qty}x {item.name}
                        </p>
                        {item.note && (
                          <p className="text-xs text-gray-400 mt-1">
                            Note: {item.note}
                          </p>
                        )}
                      </div>
                      <p className="text-slate-600">
                        {formatCurrency(item.price * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle size={14} className="inline mr-2" />
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Payment */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-cyan-600">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-500">
                    {selectedOrder.paymentMethod}
                  </span>
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${
                      PAYMENT_STATUS_CONFIG[selectedOrder.paymentStatus]?.color
                    }`}
                  >
                    {PAYMENT_STATUS_CONFIG[selectedOrder.paymentStatus]?.label}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {selectedOrder.paymentStatus === "PENDING" && (
                  <button
                    onClick={() =>
                      updateOrderStatus(
                        selectedOrder.orderId,
                        undefined,
                        "PAID"
                      )
                    }
                    disabled={isUpdating}
                    className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? "Loading..." : "✓ Konfirmasi Pembayaran"}
                  </button>
                )}

                {getNextStatus(selectedOrder.orderStatus) && (
                  <button
                    onClick={() =>
                      updateOrderStatus(
                        selectedOrder.orderId,
                        getNextStatus(selectedOrder.orderStatus)!
                      )
                    }
                    disabled={isUpdating}
                    className="w-full py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      getNextStatusLabel(selectedOrder.orderStatus)
                    )}
                  </button>
                )}

                <button
                  onClick={() => handlePrint(selectedOrder)}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Print untuk Dapur
                </button>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Template (Hidden) */}
      <div className="hidden print:block">
        {printOrder && (
          <div className="p-8 max-w-md mx-auto" ref={printRef}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">
                {settings.storeName || "FoodCourt POS"}
              </h1>
              <p className="text-sm text-gray-500">PESANAN DAPUR</p>
            </div>

            <div className="border-t border-b border-dashed border-gray-300 py-4 my-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">No. Antrian:</span>
                <span className="text-3xl font-bold">
                  #{printOrder.queueNumber}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Order ID:</span>
                <span>{printOrder.orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Waktu:</span>
                <span>{formatDateTime(printOrder.createdAt)}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-semibold mb-1">Pelanggan:</p>
              <p>{printOrder.customerName}</p>
              <p className="text-sm text-gray-500">
                {printOrder.customerPhone}
              </p>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-4">
              <p className="font-semibold mb-2">PESANAN:</p>
              {printOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between py-2 border-b border-gray-100"
                >
                  <div>
                    <span className="font-bold text-lg">{item.qty}x</span>
                    <span className="ml-2">{item.name}</span>
                    {item.note && (
                      <p className="text-sm text-gray-500 italic">
                        → {item.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {printOrder.notes && (
              <div className="mt-4 p-3 border border-gray-300 rounded">
                <p className="font-semibold">CATATAN:</p>
                <p>{printOrder.notes}</p>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-gray-400">
              --- Terima Kasih ---
            </div>
          </div>
        )}
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default OnlineOrdersPage;
