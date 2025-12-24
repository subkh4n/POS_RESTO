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
  X,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { GOOGLE_SCRIPT_URL } from "../constants";

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

  const handleDelete = async (userId: string) => {
    if (userId === currentUserId) {
      alert("Tidak bisa menghapus akun sendiri!");
      return;
    }
    if (!confirm("Yakin ingin menghapus user ini?")) return;

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "deleteUser", id: userId }),
      });
      const data = await response.json();

      if (data.success) {
        fetchUsers();
      } else {
        alert(data.message || "Gagal menghapus user");
      }
    } catch {
      alert("Terjadi kesalahan");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: "bg-purple-100 text-purple-700",
      MANAGER: "bg-amber-100 text-amber-700",
      KASIR: "bg-blue-100 text-blue-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-bold ${
          styles[role] || "bg-gray-100"
        }`}
      >
        {role}
      </span>
    );
  };

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
              <Users size={24} />
            </div>
            Manajemen Pengguna
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola akun pengguna sistem POS
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-purple-200"
        >
          <UserPlus size={18} />
          Tambah User
        </button>
      </div>

      {/* Search & Refresh */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari nama atau username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={fetchUsers}
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-purple-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Users size={48} className="mb-3 opacity-50" />
            <p className="font-medium">Tidak ada user ditemukan</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">
                  User
                </th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">
                  Role
                </th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">
                  Kontak
                </th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-400">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">{getRoleBadge(user.role)}</td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-gray-600">{user.email || "-"}</p>
                    <p className="text-xs text-gray-400">{user.phone || "-"}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`flex items-center gap-1.5 text-xs font-medium ${
                        user.isActive ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          user.isActive ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      ></span>
                      {user.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                        title="Hapus"
                        disabled={user.id === currentUserId}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {editingUser ? "Edit User" : "Tambah User Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                      disabled={!!editingUser}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? "Password Baru" : "Password"}
                  </label>
                  <div className="relative">
                    <Key
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder={
                        editingUser ? "Kosongkan jika tidak diubah" : ""
                      }
                      required={!editingUser}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="relative">
                  <Shield
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as any })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
                  >
                    <option value="KASIR">Kasir</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
                <span className="text-sm text-gray-700">Akun Aktif</span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  {editingUser ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
