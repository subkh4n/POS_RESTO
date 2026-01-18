// Settings Page - Tab-based Layout with Umum, Pengguna, QRIS, Tentang

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
  QrCode,
  Upload,
  Trash2,
  Check,
} from "lucide-react";
import { useAuth } from "../modules/user";
import { GOOGLE_SCRIPT_URL } from "../constants";
import { db, QrisPayload } from "../lib/db";
import { decodeQRISFromImage } from "../lib/qris";

type TabType = "umum" | "pengguna" | "qris" | "tentang";

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
    { id: "qris" as TabType, label: "QRIS", icon: QrCode },
    { id: "tentang" as TabType, label: "Tentang", icon: Info },
  ];

  // QRIS state
  const [qrisList, setQrisList] = useState<QrisPayload[]>([]);
  const [isLoadingQris, setIsLoadingQris] = useState(false);
  const [isUploadingQris, setIsUploadingQris] = useState(false);
  const [testAmount, setTestAmount] = useState<string>("10000");
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);

  const loadQrisData = async () => {
    setIsLoadingQris(true);
    try {
      const data = await db.qris.list();
      setQrisList(data);
    } catch (error) {
      console.error("Failed to load QRIS:", error);
    } finally {
      setIsLoadingQris(false);
    }
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingQris(true);
    try {
      const payload = await decodeQRISFromImage(file);
      if (!payload) {
        alert("QRIS tidak terdeteksi. Pastikan gambar jelas.");
        return;
      }
      const name = prompt("Nama QRIS:", "QRIS Toko");
      if (name) {
        await db.qris.create(name, payload);
        await loadQrisData();
        setSuccessMsg("QRIS berhasil ditambahkan!");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      setError(
        "Gagal decode QRIS: " +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setIsUploadingQris(false);
      e.target.value = "";
    }
  };

  const handleSetActiveQris = async (id: string) => {
    await db.qris.setActive(id);
    await loadQrisData();
  };

  const handleDeleteQris = async (id: string) => {
    if (!confirm("Hapus QRIS ini?")) return;
    await db.qris.delete(id);
    await loadQrisData();
  };

  const handleTestGenerate = async (payload: string) => {
    try {
      const { generateDynamicQRIS } = await import("../lib/qris");
      const amount = parseInt(testAmount) || 10000;
      const qrDataUrl = await generateDynamicQRIS(payload, amount);
      setGeneratedQR(qrDataUrl);
    } catch (error) {
      alert(
        "Gagal generate: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  };

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
    currentValue: boolean,
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
    loadQrisData();
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
                                      hasAccess(role, perm.key),
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

      case "qris":
        return (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Upload size={20} className="text-blue-500" />
                <h3 className="font-bold text-gray-800">Upload QRIS Static</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Upload gambar QRIS Static dari merchant (GoPay, OVO, DANA, dll).
                Sistem akan decode dan menyimpan payload untuk generate QRIS
                dinamis.
              </p>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrisUpload}
                  disabled={isUploadingQris}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2.5 file:px-5
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-600 file:text-white
                    hover:file:bg-blue-700 file:cursor-pointer
                    file:transition-colors disabled:opacity-50"
                />
              </label>
              {isUploadingQris && (
                <p className="text-sm text-blue-600 mt-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Membaca QRIS...
                </p>
              )}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QRIS List */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <QrCode size={20} className="text-purple-500" />
                  <h3 className="font-bold text-gray-800">
                    Daftar QRIS Tersimpan
                  </h3>
                </div>

                {isLoadingQris ? (
                  <div className="py-8 text-center">
                    <Loader2
                      size={24}
                      className="animate-spin text-gray-400 mx-auto"
                    />
                  </div>
                ) : qrisList.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 border-2 border-dashed rounded-xl">
                    <QrCode size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada QRIS tersimpan</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {qrisList.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-xl ${
                          item.is_active
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-800">
                                {item.name}
                              </p>
                              {item.is_active && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-green-700 bg-green-100 rounded-full">
                                  <Check size={12} /> Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 font-mono truncate mt-1">
                              {item.payload.substring(0, 35)}...
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Dibuat:{" "}
                              {new Date(item.created_at).toLocaleDateString(
                                "id-ID",
                              )}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {!item.is_active && (
                              <button
                                onClick={() => handleSetActiveQris(item.id)}
                                className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                Set Aktif
                              </button>
                            )}
                            <button
                              onClick={() => handleTestGenerate(item.payload)}
                              className="px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                              Test
                            </button>
                            <button
                              onClick={() => handleDeleteQris(item.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Test Generator */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">Test Generator</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nominal Test (Rp)
                  </label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                      transition-all outline-none"
                  />
                </div>

                {generatedQR ? (
                  <div className="text-center py-4">
                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl shadow-inner">
                      <img
                        src={generatedQR}
                        alt="QRIS Generated"
                        className="mx-auto w-48 h-48 object-contain"
                      />
                    </div>
                    <p className="text-lg font-bold text-gray-800 mt-4">
                      Rp {parseInt(testAmount || "0").toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Scan dengan aplikasi dompet digital
                    </p>
                    <button
                      onClick={() => setGeneratedQR(null)}
                      className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      Reset Preview
                    </button>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-400">
                    <QrCode size={40} className="mb-3 opacity-50" />
                    <p className="text-sm">Pilih "Test" pada salah satu QRIS</p>
                    <p className="text-xs">untuk melihat preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-700">
                <strong>Cara kerja:</strong> QRIS yang diset aktif akan
                digunakan saat checkout. Sistem akan otomatis inject nominal
                transaksi ke QR Code.
              </p>
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
