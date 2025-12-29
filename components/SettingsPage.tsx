// Settings Page - Role Permissions & App Info

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  User,
  CheckCircle2,
  XCircle,
  Info,
  Lock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../modules/user";
import { GOOGLE_SCRIPT_URL } from "../constants";

interface SettingsPageProps {}

// Permission configuration
const PERMISSIONS = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "pos", label: "POS / Kasir", icon: "💰" },
  { key: "reports", label: "Laporan Penjualan", icon: "📈" },
  { key: "finance", label: "Laporan Keuangan", icon: "💵" },
  { key: "items", label: "Kelola Menu", icon: "🍽️" },
  { key: "users", label: "Kelola Pengguna", icon: "👥" },
  { key: "settings", label: "Pengaturan", icon: "⚙️" },
];

// Default permissions (fallback)
const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  ADMIN: {
    dashboard: true,
    pos: true,
    reports: true,
    finance: true,
    items: true,
    users: true,
    settings: true,
  },
  MANAGER: {
    dashboard: true,
    pos: true,
    reports: true,
    finance: true,
    items: true,
    users: false,
    settings: false,
  },
  KASIR: {
    dashboard: true,
    pos: true,
    reports: false,
    finance: false,
    items: false,
    users: false,
    settings: false,
  },
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: "Akses penuh ke semua fitur sistem termasuk kelola pengguna",
  MANAGER: "Akses ke laporan, keuangan, dan kelola menu",
  KASIR: "Akses terbatas untuk transaksi kasir",
};

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] =
    useState<Record<string, Record<string, boolean>>>(DEFAULT_PERMISSIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch permissions from API
  const fetchPermissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getPermissions" }),
      });
      const data = await response.json();
      if (data.permissions) {
        setPermissions(data.permissions);
      }
    } catch (err) {
      setError("Gagal memuat permissions");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Toggle permission
  const handleTogglePermission = async (
    role: string,
    feature: string,
    currentValue: boolean
  ) => {
    // Don't allow editing ADMIN permissions
    if (role === "ADMIN") {
      return;
    }

    const savingKey = `${role}-${feature}`;
    setIsSaving(savingKey);

    // Optimistic update
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [feature]: !currentValue,
      },
    }));

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "updatePermissions",
          role,
          feature,
          enabled: !currentValue,
        }),
      });
      const data = await response.json();

      if (!data.success) {
        // Revert on error
        setPermissions((prev) => ({
          ...prev,
          [role]: {
            ...prev[role],
            [feature]: currentValue,
          },
        }));
        setError(data.message || "Gagal menyimpan permission");
      }
    } catch (err) {
      // Revert on error
      setPermissions((prev) => ({
        ...prev,
        [role]: {
          ...prev[role],
          [feature]: currentValue,
        },
      }));
      setError("Gagal menyimpan permission");
    } finally {
      setIsSaving(null);
    }
  };

  const hasAccess = (role: string, feature: string) => {
    return permissions[role]?.[feature] ?? false;
  };

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
              <Settings size={24} />
            </div>
            Pengaturan
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Informasi aplikasi dan hak akses pengguna
          </p>
        </div>
        <button
          onClick={fetchPermissions}
          disabled={isLoading}
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
          <XCircle size={16} />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Current User Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-200">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
            <p className="text-gray-500 text-sm">@{user?.username}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  user?.role === "ADMIN"
                    ? "bg-purple-100 text-purple-700"
                    : user?.role === "MANAGER"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {user?.role}
              </span>
              <span className="text-xs text-gray-400">
                {ROLE_DESCRIPTIONS[user?.role || "KASIR"]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Permissions Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Shield size={20} className="text-purple-500" />
            Hak Akses Berdasarkan Role
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === "ADMIN"
              ? "Klik toggle untuk mengubah hak akses MANAGER dan KASIR"
              : "Daftar fitur yang dapat diakses oleh setiap role pengguna"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase">
                    Fitur
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-bold text-purple-600 uppercase">
                    <div className="flex flex-col items-center gap-1">
                      <Lock size={14} />
                      ADMIN
                    </div>
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-bold text-amber-600 uppercase">
                    <div className="flex flex-col items-center gap-1">
                      <User size={14} />
                      MANAGER
                    </div>
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-bold text-blue-600 uppercase">
                    <div className="flex flex-col items-center gap-1">
                      <User size={14} />
                      KASIR
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {PERMISSIONS.map((perm) => (
                  <tr
                    key={perm.key}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{perm.icon}</span>
                        <span className="font-medium text-gray-700">
                          {perm.label}
                        </span>
                      </div>
                    </td>
                    {/* ADMIN - Always ON, not editable */}
                    <td className="py-4 px-6 text-center">
                      <CheckCircle2
                        size={20}
                        className="text-emerald-500 mx-auto"
                      />
                    </td>
                    {/* MANAGER - Editable by ADMIN */}
                    <td className="py-4 px-6 text-center">
                      {user?.role === "ADMIN" ? (
                        <button
                          onClick={() =>
                            handleTogglePermission(
                              "MANAGER",
                              perm.key,
                              hasAccess("MANAGER", perm.key)
                            )
                          }
                          disabled={isSaving === `MANAGER-${perm.key}`}
                          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                          style={{
                            backgroundColor: hasAccess("MANAGER", perm.key)
                              ? "#10b981"
                              : "#d1d5db",
                          }}
                        >
                          {isSaving === `MANAGER-${perm.key}` ? (
                            <Loader2
                              size={14}
                              className="absolute left-1/2 -translate-x-1/2 animate-spin text-white"
                            />
                          ) : (
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                                hasAccess("MANAGER", perm.key)
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          )}
                        </button>
                      ) : hasAccess("MANAGER", perm.key) ? (
                        <CheckCircle2
                          size={20}
                          className="text-emerald-500 mx-auto"
                        />
                      ) : (
                        <XCircle size={20} className="text-red-300 mx-auto" />
                      )}
                    </td>
                    {/* KASIR - Editable by ADMIN */}
                    <td className="py-4 px-6 text-center">
                      {user?.role === "ADMIN" ? (
                        <button
                          onClick={() =>
                            handleTogglePermission(
                              "KASIR",
                              perm.key,
                              hasAccess("KASIR", perm.key)
                            )
                          }
                          disabled={isSaving === `KASIR-${perm.key}`}
                          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                          style={{
                            backgroundColor: hasAccess("KASIR", perm.key)
                              ? "#10b981"
                              : "#d1d5db",
                          }}
                        >
                          {isSaving === `KASIR-${perm.key}` ? (
                            <Loader2
                              size={14}
                              className="absolute left-1/2 -translate-x-1/2 animate-spin text-white"
                            />
                          ) : (
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                                hasAccess("KASIR", perm.key)
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          )}
                        </button>
                      ) : hasAccess("KASIR", perm.key) ? (
                        <CheckCircle2
                          size={20}
                          className="text-emerald-500 mx-auto"
                        />
                      ) : (
                        <XCircle size={20} className="text-red-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Admin Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Lock size={20} />
            </div>
            <h4 className="font-bold">ADMIN</h4>
          </div>
          <p className="text-sm text-purple-100">{ROLE_DESCRIPTIONS.ADMIN}</p>
        </div>

        {/* Manager Card */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <User size={20} />
            </div>
            <h4 className="font-bold">MANAGER</h4>
          </div>
          <p className="text-sm text-amber-100">{ROLE_DESCRIPTIONS.MANAGER}</p>
        </div>

        {/* Kasir Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <User size={20} />
            </div>
            <h4 className="font-bold">KASIR</h4>
          </div>
          <p className="text-sm text-blue-100">{ROLE_DESCRIPTIONS.KASIR}</p>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Info size={20} className="text-gray-400" />
          <h3 className="font-bold text-gray-800">Informasi Aplikasi</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">
              Nama Aplikasi
            </p>
            <p className="font-bold text-gray-700">FoodCourt POS</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Versi</p>
            <p className="font-bold text-gray-700">v3.5.0</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">
              Backend
            </p>
            <p className="font-bold text-gray-700">Google Apps Script</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">
              Database
            </p>
            <p className="font-bold text-gray-700">Google Sheets</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
