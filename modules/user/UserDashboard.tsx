// User Dashboard Component

import React from "react";
import {
  User,
  LogOut,
  Settings,
  Shield,
  Clock,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { UserRole } from "./types";

interface UserDashboardProps {
  onClose?: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onClose }) => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const getRoleBadge = (role: UserRole) => {
    const styles: Record<UserRole, string> = {
      [UserRole.ADMIN]: "bg-purple-100 text-purple-700 border-purple-200",
      [UserRole.KASIR]: "bg-blue-100 text-blue-700 border-blue-200",
      [UserRole.MANAGER]: "bg-amber-100 text-amber-700 border-amber-200",
    };
    const labels: Record<UserRole, string> = {
      [UserRole.ADMIN]: "Administrator",
      [UserRole.KASIR]: "Kasir",
      [UserRole.MANAGER]: "Manager",
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[role]}`}
      >
        {labels[role]}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      logout();
      if (onClose) onClose();
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full">
      {/* Header with Avatar */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold border-2 border-white/20">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-slate-400 text-sm">@{user.username}</p>
          </div>
          {getRoleBadge(user.role)}
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 space-y-4">
        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          {user.email && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Mail size={14} />
                <span className="text-xs">Email</span>
              </div>
              <p className="text-sm font-medium text-gray-700 truncate">
                {user.email}
              </p>
            </div>
          )}
          {user.phone && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Phone size={14} />
                <span className="text-xs">Telepon</span>
              </div>
              <p className="text-sm font-medium text-gray-700">{user.phone}</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Calendar size={14} />
              <span className="text-xs">Bergabung</span>
            </div>
            <p className="text-sm font-medium text-gray-700">
              {formatDate(user.createdAt)}
            </p>
          </div>
          {user.lastLogin && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Clock size={14} />
                <span className="text-xs">Login Terakhir</span>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {formatTime(user.lastLogin)}
              </p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">Status Akun</span>
          <span
            className={`flex items-center gap-2 text-sm font-medium ${
              user.isActive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                user.isActive ? "bg-emerald-500" : "bg-red-500"
              }`}
            ></span>
            {user.isActive ? "Aktif" : "Nonaktif"}
          </span>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          {user.role === UserRole.ADMIN && (
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                  <Shield size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700">
                    Kelola Pengguna
                  </p>
                  <p className="text-xs text-gray-400">
                    Tambah, edit, hapus user
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          )}

          <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Settings size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">Pengaturan</p>
                <p className="text-xs text-gray-400">Ubah password & profil</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-colors mt-4"
        >
          <LogOut size={18} />
          Keluar dari Akun
        </button>
      </div>
    </div>
  );
};

export default UserDashboard;
