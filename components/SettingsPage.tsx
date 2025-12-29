// Settings Page - Tab-based Layout with Umum, Pengguna, Tentang

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
  Store,
  Phone,
  MapPin,
  Save,
  Building2,
  Users,
} from "lucide-react";
import { useAuth } from "../modules/user";
import { GOOGLE_SCRIPT_URL } from "../constants";

type TabType = "umum" | "pengguna" | "tentang";

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

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("umum");
  const [permissions, setPermissions] =
    useState<Record<string, Record<string, boolean>>>(DEFAULT_PERMISSIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    storeName: "FoodCourt POS",
    storeAddress: "",
    storePhone: "",
    storeTagline: "Sistem Kasir Modern",
  });
  const [isSavingStore, setIsSavingStore] = useState(false);

  // Tab configuration
  const tabs = [
    { id: "umum" as TabType, label: "Umum", icon: Building2 },
    { id: "pengguna" as TabType, label: "Pengguna", icon: Users },
    { id: "tentang" as TabType, label: "Tentang", icon: Info },
  ];

  // Fetch functions
  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getPermissions" }),
      });
      const data = await response.json();
      if (data.permissions) setPermissions(data.permissions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getStoreSettings" }),
      });
      const data = await response.json();
      if (data.settings) setStoreSettings(data.settings);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStoreSettings = async () => {
    setIsSavingStore(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "updateStoreSettings",
          ...storeSettings,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg("Pengaturan toko berhasil disimpan!");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(data.message || "Gagal menyimpan");
      }
    } catch (err) {
      setError("Gagal menyimpan pengaturan");
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleTogglePermission = async (
    role: string,
    feature: string,
    currentValue: boolean
  ) => {
    if (role === "ADMIN") return;
    const savingKey = `${role}-${feature}`;
    setIsSaving(savingKey);
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [feature]: !currentValue },
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
        setPermissions((prev) => ({
          ...prev,
          [role]: { ...prev[role], [feature]: currentValue },
        }));
        setError(data.message || "Gagal menyimpan");
      }
    } catch (err) {
      setPermissions((prev) => ({
        ...prev,
        [role]: { ...prev[role], [feature]: currentValue },
      }));
    } finally {
      setIsSaving(null);
    }
  };

  useEffect(() => {
    fetchPermissions();
    fetchStoreSettings();
  }, []);

  const hasAccess = (role: string, feature: string) =>
    permissions[role]?.[feature] ?? false;

  // Render Tab Content
  const renderTabContent = () => {
    switch (activeTab) {
      case "umum":
        return (
          <div className="space-y-6">
            {/* Store Info Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Store size={20} className="text-emerald-500" />
                <h3 className="font-bold text-gray-800">Pengaturan Toko</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Toko
                  </label>
                  <div className="relative">
                    <Store
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={storeSettings.storeName}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          storeName: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={storeSettings.storeTagline}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        storeTagline: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Toko
                  </label>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={storeSettings.storeAddress}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          storeAddress: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Telepon
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="tel"
                      value={storeSettings.storePhone}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          storePhone: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveStoreSettings}
                disabled={isSavingStore}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
              >
                {isSavingStore ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Simpan Pengaturan
              </button>
            </div>
          </div>
        );

      case "pengguna":
        return (
          <div className="space-y-6">
            {/* Role Permissions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Shield size={20} className="text-purple-500" />
                  Hak Akses Berdasarkan Role
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {user?.role === "ADMIN"
                    ? "Toggle untuk mengubah akses MANAGER dan KASIR"
                    : "Daftar hak akses per role"}
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-purple-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-6 text-xs font-bold text-gray-500 uppercase">
                          Fitur
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-purple-600 uppercase">
                          ADMIN
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-amber-600 uppercase">
                          MANAGER
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-blue-600 uppercase">
                          KASIR
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {PERMISSIONS.map((perm) => (
                        <tr key={perm.key} className="hover:bg-gray-50/50">
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-2">
                              <span>{perm.icon}</span>
                              <span className="font-medium text-gray-700 text-sm">
                                {perm.label}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <CheckCircle2
                              size={18}
                              className="text-emerald-500 mx-auto"
                            />
                          </td>
                          {["MANAGER", "KASIR"].map((role) => (
                            <td key={role} className="py-3 px-4 text-center">
                              {user?.role === "ADMIN" ? (
                                <button
                                  onClick={() =>
                                    handleTogglePermission(
                                      role,
                                      perm.key,
                                      hasAccess(role, perm.key)
                                    )
                                  }
                                  disabled={isSaving === `${role}-${perm.key}`}
                                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                                  style={{
                                    backgroundColor: hasAccess(role, perm.key)
                                      ? "#10b981"
                                      : "#d1d5db",
                                  }}
                                >
                                  {isSaving === `${role}-${perm.key}` ? (
                                    <Loader2
                                      size={12}
                                      className="absolute left-1/2 -translate-x-1/2 animate-spin text-white"
                                    />
                                  ) : (
                                    <span
                                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                        hasAccess(role, perm.key)
                                          ? "translate-x-5"
                                          : "translate-x-0.5"
                                      }`}
                                    />
                                  )}
                                </button>
                              ) : hasAccess(role, perm.key) ? (
                                <CheckCircle2
                                  size={18}
                                  className="text-emerald-500 mx-auto"
                                />
                              ) : (
                                <XCircle
                                  size={18}
                                  className="text-red-300 mx-auto"
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  role: "ADMIN",
                  color: "from-purple-500 to-purple-600",
                  textColor: "text-purple-100",
                  icon: Lock,
                },
                {
                  role: "MANAGER",
                  color: "from-amber-500 to-amber-600",
                  textColor: "text-amber-100",
                  icon: User,
                },
                {
                  role: "KASIR",
                  color: "from-blue-500 to-blue-600",
                  textColor: "text-blue-100",
                  icon: User,
                },
              ].map(({ role, color, textColor, icon: Icon }) => (
                <div
                  key={role}
                  className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <Icon size={16} />
                    </div>
                    <h4 className="font-bold text-sm">{role}</h4>
                  </div>
                  <p className={`text-xs ${textColor}`}>
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case "tentang":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Info size={20} className="text-gray-400" />
                <h3 className="font-bold text-gray-800">Informasi Aplikasi</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  {
                    label: "Nama Aplikasi",
                    value: storeSettings.storeName || "FoodCourt POS",
                  },
                  { label: "Versi", value: "v3.6.0" },
                  { label: "Backend", value: "Google Apps Script" },
                  { label: "Database", value: "Google Sheets" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-400 uppercase font-medium">
                      {item.label}
                    </p>
                    <p className="font-bold text-gray-700">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-2">Tentang Sistem</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                FoodCourt POS adalah sistem kasir modern berbasis web yang
                menggunakan Google Sheets sebagai database dan Google Apps
                Script sebagai backend. Cocok untuk foodcourt, restoran, dan
                cafe dengan fitur manajemen menu, transaksi, laporan, dan
                multi-user.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex">
      {/* Sidebar Tabs */}
      <div className="w-56 bg-slate-900 p-4 flex flex-col">
        <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
          <Settings size={20} />
          Pengaturan
        </h2>
        <nav className="space-y-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* User Profile at Bottom */}
        <div className="mt-auto pt-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.name}
              </p>
              <p className="text-slate-400 text-xs truncate">
                @{user?.username}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
            <XCircle size={16} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              ×
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {renderTabContent()}
      </div>
    </div>
  );
};

export default SettingsPage;
