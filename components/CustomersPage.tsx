import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Edit,
  Trash2,
  Key,
  Phone,
  Mail,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { GOOGLE_SCRIPT_URL } from "../constants";
import { toast } from "sonner";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
}

const ITEMS_PER_PAGE = 10;

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  // Dummy data for testing
  const DUMMY_CUSTOMERS: Customer[] = [
    {
      id: "CUST-001",
      name: "Ahmad Sudirman",
      phone: "081234567890",
      email: "ahmad@email.com",
      address: "Jl. Merdeka No. 123, Jakarta",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true,
    },
    {
      id: "CUST-002",
      name: "Siti Rahayu",
      phone: "087654321098",
      email: "siti@email.com",
      address: "Jl. Pahlawan No. 45, Bandung",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastLogin: new Date(Date.now() - 3600000).toISOString(),
      isActive: true,
    },
    {
      id: "CUST-003",
      name: "Budi Santoso",
      phone: "082345678901",
      email: "budi@email.com",
      address: "Jl. Sudirman No. 67, Surabaya",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      lastLogin: "",
      isActive: false,
    },
  ];

  const [useDummy] = useState(true);

  const fetchCustomers = async () => {
    if (useDummy) {
      setCustomers(DUMMY_CUSTOMERS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getCustomers" }),
      });
      const data = await response.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast.error("Gagal memuat data pelanggan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleActive = async (customer: Customer) => {
    if (useDummy) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id ? { ...c, isActive: !c.isActive } : c
        )
      );
      toast.success(`Status ${customer.name} berhasil diubah`);
      return;
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "toggleCustomerActive",
          id: customer.id,
          isActive: !customer.isActive,
        }),
      });
      const data = await response.json();
      if (data.success) {
        fetchCustomers();
        toast.success("Status berhasil diubah");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast.error("Gagal mengubah status");
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (useDummy) {
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      toast.success(`Pelanggan ${customer.name} berhasil dihapus`);
      setDeleteDialogId(null);
      return;
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "deleteCustomer", id: customer.id }),
      });
      const data = await response.json();
      if (data.success) {
        fetchCustomers();
        toast.success("Pelanggan berhasil dihapus");
        setDeleteDialogId(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Gagal menghapus pelanggan");
    }
  };

  const handleUpdate = async () => {
    if (!selectedCustomer) return;
    setIsSubmitting(true);

    if (useDummy) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id ? { ...c, ...editForm } : c
        )
      );
      toast.success("Data pelanggan berhasil diperbarui");
      setIsEditing(false);
      setSelectedCustomer(null);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "updateCustomer",
          id: selectedCustomer.id,
          ...editForm,
        }),
      });
      const data = await response.json();
      if (data.success) {
        fetchCustomers();
        toast.success("Data pelanggan berhasil diperbarui");
        setIsEditing(false);
        setSelectedCustomer(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Failed to update:", error);
      toast.error("Gagal memperbarui data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedCustomer || !newPassword) return;
    setIsSubmitting(true);

    if (useDummy) {
      toast.success("Password berhasil direset (demo)");
      setShowResetPassword(false);
      setNewPassword("");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "resetCustomerPassword",
          id: selectedCustomer.id,
          newPassword: newPassword,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Password berhasil direset");
        setShowResetPassword(false);
        setNewPassword("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Failed to reset password:", error);
      toast.error("Gagal reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Belum pernah login";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter
  const filteredCustomers = customers.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.email.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-10 w-80" />
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
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Pelanggan</h1>
            <p className="text-muted-foreground">
              {customers.length} pelanggan terdaftar
            </p>
          </div>
          <Button variant="outline" onClick={fetchCustomers}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama, HP, atau email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        {/* Table */}
        {paginatedCustomers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Tidak ada pelanggan</p>
              <p className="text-sm">Data pelanggan akan muncul di sini</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead className="hidden md:table-cell">Alamat</TableHead>
                    <TableHead className="hidden lg:table-cell">Terdaftar</TableHead>
                    <TableHead className="hidden lg:table-cell">Login Terakhir</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {customer.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {customer.phone}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {customer.email || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {customer.address || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="text-sm">{formatDate(customer.createdAt)}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(customer.lastLogin)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={customer.isActive}
                            onCheckedChange={() => handleToggleActive(customer)}
                          />
                          <Badge variant={customer.isActive ? "default" : "secondary"}>
                            {customer.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setEditForm(customer);
                                  setIsEditing(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setShowResetPassword(true);
                                }}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reset Password</TooltipContent>
                          </Tooltip>

                          <Dialog
                            open={deleteDialogId === customer.id}
                            onOpenChange={(open) => !open && setDeleteDialogId(null)}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeleteDialogId(customer.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Hapus</TooltipContent>
                            </Tooltip>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Hapus Pelanggan?</DialogTitle>
                                <DialogDescription>
                                  Apakah Anda yakin ingin menghapus pelanggan "{customer.name}"?
                                  Aksi ini tidak dapat dibatalkan.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Batal</Button>
                                </DialogClose>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(customer)}
                                >
                                  Hapus
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)}{" "}
                dari {filteredCustomers.length}
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

        {/* Edit Modal */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pelanggan</DialogTitle>
              <DialogDescription>
                Perbarui informasi pelanggan di bawah ini
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nama</Label>
                <Input
                  id="edit-name"
                  value={editForm.name || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">No. HP</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Alamat</Label>
                <Textarea
                  id="edit-address"
                  value={editForm.address || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Batal</Button>
              </DialogClose>
              <Button onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Modal */}
        <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Reset password untuk <strong>{selectedCustomer?.name}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Masukkan password baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setNewPassword("")}>
                  Batal
                </Button>
              </DialogClose>
              <Button
                onClick={handleResetPassword}
                disabled={isSubmitting || !newPassword}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default CustomersPage;
