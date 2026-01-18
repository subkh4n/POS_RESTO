import React, { useState, useEffect } from "react";
import { Upload, Check, Trash2, QrCode, RefreshCw } from "lucide-react";
import { db, QrisPayload } from "../lib/db";
import { decodeQRISFromImage, generateDynamicQRIS } from "../lib/qris";

export default function AdminQrisManager() {
  const [qrisList, setQrisList] = useState<QrisPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewAmount, setPreviewAmount] = useState<string>("10000");
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await db.qris.list();
      setQrisList(data);
    } catch (error) {
      console.error("Failed to load QRIS data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk upload gambar QRIS
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const payload = await decodeQRISFromImage(file);
      if (!payload) {
        alert(
          "QRIS tidak terdeteksi dalam gambar. Pastikan gambar jelas dan tidak terpotong.",
        );
        return;
      }

      const name = prompt("Masukkan nama untuk QRIS ini:", "QRIS Baru");
      if (name) {
        await db.qris.create(name, payload);
        await loadData();
        alert("QRIS berhasil ditambahkan!");
      }
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  // Handler untuk set QRIS aktif
  const handleSetActive = async (id: string) => {
    try {
      await db.qris.setActive(id);
      await loadData();
    } catch (error) {
      alert("Gagal mengaktifkan QRIS");
    }
  };

  // Handler untuk hapus QRIS
  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus QRIS ini?")) return;
    try {
      await db.qris.delete(id);
      await loadData();
      if (selectedPayload === id) {
        setGeneratedQR(null);
        setSelectedPayload(null);
      }
    } catch (error) {
      alert("Gagal menghapus QRIS");
    }
  };

  // Handler untuk test generate QR
  const handleTestGenerate = async (payload: string, id: string) => {
    try {
      const amount = parseInt(previewAmount);
      if (isNaN(amount) || amount <= 0) {
        alert("Masukkan nominal yang valid");
        return;
      }
      const qrDataUrl = await generateDynamicQRIS(payload, amount);
      setGeneratedQR(qrDataUrl);
      setSelectedPayload(id);
    } catch (error) {
      alert(
        "Gagal generate QR: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen QRIS</h1>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Upload QRIS Static
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Upload gambar QRIS Static dari merchant (GoPay, OVO, DANA, dll).
          Sistem akan otomatis membaca dan menyimpan payload-nya.
        </p>
        <label className="block">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2.5 file:px-5
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700 file:cursor-pointer
              file:transition-colors
              disabled:opacity-50"
          />
        </label>
        {uploading && (
          <p className="text-sm text-blue-600 mt-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Membaca QRIS dari gambar...
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-purple-600" />
            Daftar QRIS Tersimpan
          </h2>

          {loading ? (
            <div className="py-8 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Memuat data...
            </div>
          ) : qrisList.length === 0 ? (
            <div className="py-8 text-center text-gray-400 border-2 border-dashed rounded-lg">
              <QrCode className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Belum ada QRIS tersimpan.</p>
              <p className="text-sm">Upload gambar QRIS untuk memulai.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {qrisList.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg transition-all ${
                    item.is_active
                      ? "border-green-500 bg-green-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        {item.is_active && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                            <Check className="w-3 h-3" />
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                        {item.payload.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Dibuat:{" "}
                        {new Date(item.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!item.is_active && (
                        <button
                          onClick={() => handleSetActive(item.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Set Aktif
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleTestGenerate(item.payload, item.id)
                        }
                        className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview/Generator Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Test Generator</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nominal Test (Rp)
            </label>
            <input
              type="number"
              value={previewAmount}
              onChange={(e) => setPreviewAmount(e.target.value)}
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
                  className="mx-auto w-64 h-64 object-contain"
                />
              </div>
              <p className="text-lg font-bold text-gray-800 mt-4">
                Rp {parseInt(previewAmount).toLocaleString("id-ID")}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Scan dengan aplikasi dompet digital untuk verifikasi
              </p>
              <button
                onClick={() => {
                  setGeneratedQR(null);
                  setSelectedPayload(null);
                }}
                className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Reset Preview
              </button>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-400">
              <QrCode className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">Pilih "Test" pada salah satu QRIS</p>
              <p className="text-xs">untuk melihat preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
