// Users Management Page - Admin Only

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Shield,
  User,
  Key,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { GOOGLE_SCRIPT_URL } from "../constants";
import { toast } from "sonner";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface UserData {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "KASIR";
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
}

interface UsersPageProps {
  currentUserId?: string;
}

const UsersPage: React.FC<UsersPageProps> = ({ currentUserId }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "KASIR" as "ADMIN" | "MANAGER" | "KASIR",
    email: "",
    phone: "",
    isActive: true,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getUsers" }),
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError("Gagal memuat data users");
      toast.error("Gagal memuat data users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user?: UserData) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: "",
        name: user.name,
        role: user.role,
        email: user.email || "",
        phone: user.phone || "",
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        name: "",
        role: "KASIR",
        email: "",
        phone: "",
        isActive: true,
      });
    }
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const action = editingUser ? "updateUser" : "addUser";
      const payload = editingUser
        ? { action, id: editingUser.id, ...formData }
        : { action, ...formData };

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(
          editingUser
            ? "User berhasil diperbarui"
            : "User berhasil ditambahkan",
        );
        setShowModal(false);
        fetchUsers();
      } else {
        setError(data.message || "Gagal menyimpan user");
      }
    } catch (err) {
      setError("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: UserData) => {
    if (user.id === currentUserId) {
      toast.warning("Tidak bisa menghapus akun sendiri!");
      return;
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "deleteUser", id: user.id }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`User ${user.name} berhasil dihapus`);
        fetchUsers();
        setDeleteDialogId(null);
      } else {
        toast.error(data.message || "Gagal menghapus user");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getRoleBadgeVariant = (
    role: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "ADMIN":
        return "default";
      case "MANAGER":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-32" />
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
                  <Skeleton className="h-6 w-16" />
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
      <div
        className="flex-1 p-6 space-y-6 overflow-auto min-h-screen"
        style={{
          background:
            "linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%)",
        }}
      >
        {/* Premium Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                boxShadow: "0 8px 24px rgba(59, 130, 246, 0.35)",
              }}
            >
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">
                Manajemen Pengguna
              </h1>
              <p className="text-sm text-gray-500">
                Kelola akun dan hak akses tim Anda
              </p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
              boxShadow: "0 6px 20px rgba(59, 130, 246, 0.35)",
            }}
            className="text-white rounded-xl px-5 border-0 hover:opacity-90"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah User
          </Button>
        </div>

        {/* Search & Refresh - Enhanced */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari nama atau username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-11 rounded-xl border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchUsers}
            className="h-11 w-11 rounded-xl border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Users Table - Premium Card Style */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              }}
            >
              <Users className="h-10 w-10 text-white" />
            </div>
            <p className="text-lg font-bold text-gray-800 mb-1">
              Tidak ada user ditemukan
            </p>
            <p className="text-sm text-gray-500">
              Tambahkan user baru untuk memulai
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Table Header */}
            <div
              className="grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 px-6 py-4 border-b border-gray-100"
              style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              }}
            >
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                User
              </div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Role
              </div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:block">
                Kontak
              </div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Status
              </div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider text-right pr-2">
                Aksi
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user, index) => {
                // Avatar gradient based on role
                const avatarGradient =
                  user.role === "ADMIN"
                    ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                    : user.role === "MANAGER"
                      ? "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)"
                      : "linear-gradient(135deg, #64748b 0%, #475569 100%)";

                // Badge styles based on role
                const badgeStyle =
                  user.role === "ADMIN"
                    ? {
                        background: "#ede9fe",
                        color: "#7c3aed",
                        border: "1px solid #ddd6fe",
                      }
                    : user.role === "MANAGER"
                      ? {
                          background: "#dbeafe",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                        }
                      : {
                          background: "#f1f5f9",
                          color: "#475569",
                          border: "1px solid #e2e8f0",
                        };

                return (
                  <div
                    key={user.id}
                    className="grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 px-6 py-4 items-center transition-all duration-200 hover:bg-blue-50/50"
                    style={{
                      background: index % 2 === 0 ? "#ffffff" : "#fafbfc",
                    }}
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                        style={{
                          background: avatarGradient,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div>
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={badgeStyle}
                      >
                        {user.role}
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="hidden md:block">
                      <p className="text-sm text-gray-700">
                        {user.email || "-"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {user.phone || "-"}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{
                          background: user.isActive ? "#d1fae5" : "#fee2e2",
                          color: user.isActive ? "#059669" : "#dc2626",
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: user.isActive ? "#10b981" : "#ef4444",
                          }}
                        ></span>
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-blue-100 text-gray-500 hover:text-blue-600"
                            onClick={() => handleOpenModal(user)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>

                      <Dialog
                        open={deleteDialogId === user.id}
                        onOpenChange={(open) =>
                          !open && setDeleteDialogId(null)
                        }
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-xl hover:bg-red-100 text-gray-500 hover:text-red-600"
                              onClick={() => setDeleteDialogId(user.id)}
                              disabled={user.id === currentUserId}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Hapus</TooltipContent>
                        </Tooltip>
                        <DialogContent className="rounded-2xl">
                          <DialogHeader>
                            <DialogTitle>Hapus User?</DialogTitle>
                            <DialogDescription>
                              Apakah Anda yakin ingin menghapus user "
                              {user.name}"? Aksi ini tidak dapat dibatalkan.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline" className="rounded-xl">
                                Batal
                              </Button>
                            </DialogClose>
                            <Button
                              variant="destructive"
                              className="rounded-xl"
                              onClick={() => handleDelete(user)}
                            >
                              Hapus
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add/Edit Modal - Top aligned for better visibility */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="fixed left-[50%] top-4 z-50 w-[95vw] max-w-md translate-x-[-50%] translate-y-0 p-0 border-0 bg-white shadow-2xl duration-200 rounded-2xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
            {/* Header - Gradient */}
            <div className="flex-none bg-linear-to-br from-blue-600 via-indigo-600 to-violet-600 p-5 text-white relative overflow-hidden rounded-t-2xl">
              {/* Decorative circles */}
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-[-20%] left-[-10%] w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

              <DialogHeader className="relative z-10 text-white space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                    {editingUser ? (
                      <Edit2 className="h-5 w-5 text-white" />
                    ) : (
                      <UserPlus className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <DialogTitle className="text-xl font-bold text-white">
                    {editingUser ? "Edit Profil Pengguna" : "Buat Akun Baru"}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-blue-100/90 text-sm">
                  {editingUser
                    ? "Perbarui data dan hak akses pengguna di bawah ini."
                    : "Lengkapi formulir untuk menambahkan user baru."}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                  <Alert
                    variant="destructive"
                    className="border-red-500/20 bg-red-50 text-red-700 animate-in fade-in zoom-in-95"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Username
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 focus:bg-white transition-all"
                        required
                        disabled={!!editingUser}
                        placeholder="john.doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {editingUser ? "Password Baru" : "Password"}
                    </Label>
                    <div className="relative group">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 focus:bg-white transition-all"
                        placeholder={
                          editingUser ? "Biarkan kosong..." : "******"
                        }
                        required={!editingUser}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Nama Lengkap
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 focus:bg-white transition-all"
                    placeholder="Contoh: John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="role"
                    className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Role & Akses
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value as any })
                      }
                    >
                      <SelectTrigger className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 focus:bg-white transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KASIR">
                          Kasir (Transaksi POS)
                        </SelectItem>
                        <SelectItem value="MANAGER">
                          Manager (Laporan & Stok)
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          Administrator (Full Akses)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 focus:bg-white transition-all"
                      placeholder="nama@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Telepon
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 focus:bg-white transition-all"
                      placeholder="0812..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                  <div className="grid gap-0.5">
                    <Label
                      htmlFor="isActive"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Status Akun
                    </Label>
                    <p className="text-xs text-gray-500">
                      Aktifkan agar user dapat login
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>

                <DialogFooter className="pt-2 gap-2 sticky bottom-0 bg-white p-4 border-t border-gray-100 -mx-6 -mb-6 mt-4">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                    >
                      Batal
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Memproses...
                      </>
                    ) : editingUser ? (
                      "Simpan Perubahan"
                    ) : (
                      "Buat Akun"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default UsersPage;
