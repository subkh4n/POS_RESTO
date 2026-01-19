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
  X,
  Search,
} from "lucide-react";
import { GOOGLE_SCRIPT_URL } from "../constants";
import { useStore } from "../contexts/StoreContext";
import { toast } from "sonner";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

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
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
> = {
  PENDING: { label: "Menunggu", variant: "outline", icon: Clock },
  CONFIRMED: { label: "Dikonfirmasi", variant: "secondary", icon: CheckCircle },
  COOKING: { label: "Diproses", variant: "default", icon: ChefHat },
  READY: { label: "Siap", variant: "default", icon: Bell },
  COMPLETED: { label: "Selesai", variant: "secondary", icon: CheckCircle },
  CANCELLED: { label: "Dibatalkan", variant: "destructive", icon: XCircle },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Belum Bayar", variant: "outline" },
  PAID: { label: "Lunas", variant: "default" },
  FAILED: { label: "Gagal", variant: "destructive" },
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
        { id: "1", name: "Nasi Goreng Special", qty: 2, price: 25000, note: "Pedas sedang" },
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
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  const [orders, setOrders] = useState<OnlineOrder[]>(DUMMY_ORDERS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [useDummy] = useState(true);

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
      toast.error("Gagal memuat pesanan");
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
        toast.success("Status berhasil diperbarui");
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
        toast.success("Status berhasil diperbarui");
      } else {
        toast.error("Gagal update status: " + data.message);
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      toast.error("Gagal update status pesanan");
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
    if (statusFilter !== "all" && order.orderStatus !== statusFilter) return false;
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
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesanan Online</h1>
          <p className="text-muted-foreground">
            {filteredOrders.length} pesanan ditemukan
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama/ID/HP..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-auto"
          />
          {dateFilter && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDateFilter("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="PENDING">Menunggu</SelectItem>
            <SelectItem value="CONFIRMED">Dikonfirmasi</SelectItem>
            <SelectItem value="COOKING">Diproses</SelectItem>
            <SelectItem value="READY">Siap</SelectItem>
            <SelectItem value="COMPLETED">Selesai</SelectItem>
            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {paginatedOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingBag className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Tidak ada pesanan</p>
            <p className="text-sm">Pesanan online akan muncul di sini</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Antrian</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="hidden lg:table-cell">Pembayaran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Waktu</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => {
                  const statusConfig = ORDER_STATUS_CONFIG[order.orderStatus] || ORDER_STATUS_CONFIG.PENDING;
                  const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING;
                  const PaymentIcon = PAYMENT_METHOD_ICON[order.paymentMethod] || CreditCard;

                  return (
                    <TableRow key={order.orderId}>
                      <TableCell>
                        <Avatar className="bg-primary/10">
                          <AvatarFallback className="text-primary font-bold">
                            #{order.queueNumber}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm">{order.items.length} item</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold">{formatCurrency(order.total)}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                          <Badge variant={paymentConfig.variant}>
                            {paymentConfig.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="gap-1">
                          {React.createElement(statusConfig.icon, { className: "h-3 w-3" })}
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="text-sm">{formatDateTime(order.createdAt)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handlePrint(order)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {getNextStatus(order.orderStatus) && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateOrderStatus(order.orderId, getNextStatus(order.orderStatus)!)
                              }
                              disabled={isUpdating}
                            >
                              {getNextStatusLabel(order.orderStatus)}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm text-muted-foreground">
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} dari{" "}
              {filteredOrders.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <DialogTitle>{selectedOrder.orderId}</DialogTitle>
                  </div>
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xl font-bold">
                    #{selectedOrder.queueNumber}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">PELANGGAN</h3>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedOrder.customerName}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedOrder.customerPhone}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">PESANAN</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start py-2 border-b">
                        <div>
                          <p className="font-medium">
                            {item.qty}x {item.name}
                          </p>
                          {item.note && (
                            <p className="text-xs text-muted-foreground">Note: {item.note}</p>
                          )}
                        </div>
                        <p className="text-muted-foreground">{formatCurrency(item.price * item.qty)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Catatan</AlertTitle>
                    <AlertDescription>{selectedOrder.notes}</AlertDescription>
                  </Alert>
                )}

                {/* Payment */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{selectedOrder.paymentMethod}</span>
                      <Badge variant={PAYMENT_STATUS_CONFIG[selectedOrder.paymentStatus]?.variant}>
                        {PAYMENT_STATUS_CONFIG[selectedOrder.paymentStatus]?.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                {selectedOrder.paymentStatus === "PENDING" && (
                  <Button
                    className="w-full"
                    variant="default"
                    onClick={() => updateOrderStatus(selectedOrder.orderId, undefined, "PAID")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "✓ Konfirmasi Pembayaran"}
                  </Button>
                )}

                {getNextStatus(selectedOrder.orderStatus) && (
                  <Button
                    className="w-full"
                    onClick={() =>
                      updateOrderStatus(selectedOrder.orderId, getNextStatus(selectedOrder.orderStatus)!)
                    }
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      getNextStatusLabel(selectedOrder.orderStatus)
                    )}
                  </Button>
                )}

                <Button className="w-full" variant="secondary" onClick={() => handlePrint(selectedOrder)}>
                  <Printer className="h-4 w-4" />
                  Print untuk Dapur
                </Button>

                <Button className="w-full" variant="outline" onClick={() => setSelectedOrder(null)}>
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Template (Hidden) */}
      <div className="hidden print:block">
        {printOrder && (
          <div className="p-8 max-w-md mx-auto" ref={printRef}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">{settings.storeName || "FoodCourt POS"}</h1>
              <p className="text-sm text-gray-500">PESANAN DAPUR</p>
            </div>

            <div className="border-t border-b border-dashed border-gray-300 py-4 my-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">No. Antrian:</span>
                <span className="text-3xl font-bold">#{printOrder.queueNumber}</span>
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
              <p className="text-sm text-gray-500">{printOrder.customerPhone}</p>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-4">
              <p className="font-semibold mb-2">PESANAN:</p>
              {printOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                  <div>
                    <span className="font-bold text-lg">{item.qty}x</span>
                    <span className="ml-2">{item.name}</span>
                    {item.note && <p className="text-sm text-gray-500 italic">→ {item.note}</p>}
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

            <div className="mt-6 text-center text-sm text-gray-400">--- Terima Kasih ---</div>
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
