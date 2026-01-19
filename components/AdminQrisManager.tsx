import React, { useState, useEffect } from "react";
import { Upload, Check, Trash2, QrCode, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db, QrisPayload } from "../lib/db";
import { decodeQRISFromImage, generateDynamicQRIS } from "../lib/qris";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function AdminQrisManager() {
  const [qrisList, setQrisList] = useState<QrisPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewAmount, setPreviewAmount] = useState<string>("10000");
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<string | null>(null);
  const [newQrisName, setNewQrisName] = useState("");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<string | null>(null);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

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
      toast.error("Gagal memuat data QRIS");
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
        toast.error(
          "QRIS tidak terdeteksi dalam gambar. Pastikan gambar jelas dan tidak terpotong."
        );
        return;
      }

      // Store payload and open dialog for name
      setPendingPayload(payload);
      setNewQrisName("QRIS Baru");
      setShowNameDialog(true);
    } catch (err) {
      toast.error("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  // Save QRIS after name confirmation
  const handleSaveQris = async () => {
    if (!pendingPayload || !newQrisName.trim()) return;

    try {
      await db.qris.create(newQrisName.trim(), pendingPayload);
      await loadData();
      toast.success("QRIS berhasil ditambahkan!");
      setShowNameDialog(false);
      setPendingPayload(null);
      setNewQrisName("");
    } catch (err) {
      toast.error("Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Handler untuk set QRIS aktif
  const handleSetActive = async (id: string) => {
    try {
      await db.qris.setActive(id);
      await loadData();
      toast.success("QRIS berhasil diaktifkan");
    } catch (error) {
      toast.error("Gagal mengaktifkan QRIS");
    }
  };

  // Handler untuk hapus QRIS
  const handleDelete = async (id: string) => {
    try {
      await db.qris.delete(id);
      await loadData();
      if (selectedPayload === id) {
        setGeneratedQR(null);
        setSelectedPayload(null);
      }
      toast.success("QRIS berhasil dihapus");
      setDeleteDialogId(null);
    } catch (error) {
      toast.error("Gagal menghapus QRIS");
    }
  };

  // Handler untuk test generate QR
  const handleTestGenerate = async (payload: string, id: string) => {
    try {
      const amount = parseInt(previewAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.warning("Masukkan nominal yang valid");
        return;
      }
      const qrDataUrl = await generateDynamicQRIS(payload, amount);
      setGeneratedQR(qrDataUrl);
      setSelectedPayload(id);
      toast.success("QR Code berhasil di-generate!");
    } catch (error) {
      toast.error(
        "Gagal generate QR: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen QRIS</h1>
          <p className="text-muted-foreground">
            Upload dan kelola QRIS untuk pembayaran toko
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload QRIS Static
          </CardTitle>
          <CardDescription>
            Upload gambar QRIS Static dari merchant (GoPay, OVO, DANA, dll).
            Sistem akan otomatis membaca dan menyimpan payload-nya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="qris-upload">Pilih Gambar QRIS</Label>
            <Input
              id="qris-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
          </div>
          {uploading && (
            <Alert className="mt-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Memproses Gambar</AlertTitle>
              <AlertDescription>
                Membaca QRIS dari gambar, mohon tunggu...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beri Nama QRIS</DialogTitle>
            <DialogDescription>
              Masukkan nama untuk mengidentifikasi QRIS ini (contoh: "QRIS Kasir 1", "GoPay Utama")
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="qris-name">Nama QRIS</Label>
              <Input
                id="qris-name"
                value={newQrisName}
                onChange={(e) => setNewQrisName(e.target.value)}
                placeholder="Masukkan nama QRIS"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleSaveQris} disabled={!newQrisName.trim()}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Daftar QRIS Tersimpan
            </CardTitle>
            <CardDescription>
              {qrisList.length} QRIS tersimpan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Memuat data...
              </div>
            ) : qrisList.length === 0 ? (
              <Alert>
                <QrCode className="h-4 w-4" />
                <AlertTitle>Belum ada QRIS</AlertTitle>
                <AlertDescription>
                  Upload gambar QRIS untuk memulai menggunakan fitur pembayaran QRIS.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {qrisList.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg transition-all ${
                      item.is_active
                        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.name}</p>
                          {item.is_active && (
                            <Badge variant="default" className="bg-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Aktif
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                          {item.payload.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Dibuat:{" "}
                          {new Date(item.created_at).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!item.is_active && (
                          <Button
                            size="sm"
                            onClick={() => handleSetActive(item.id)}
                          >
                            Set Aktif
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleTestGenerate(item.payload, item.id)
                          }
                        >
                          Test
                        </Button>

                        {/* Delete Dialog */}
                        <Dialog
                          open={deleteDialogId === item.id}
                          onOpenChange={(open) => !open && setDeleteDialogId(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteDialogId(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Hapus QRIS?</DialogTitle>
                              <DialogDescription>
                                Apakah Anda yakin ingin menghapus QRIS "{item.name}"?
                                Aksi ini tidak dapat dibatalkan.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Batal</Button>
                              </DialogClose>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                Hapus
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview/Generator Section */}
        <Card>
          <CardHeader>
            <CardTitle>Test Generator</CardTitle>
            <CardDescription>
              Preview QR Code dengan nominal tertentu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="test-amount">Nominal Test (Rp)</Label>
              <Input
                id="test-amount"
                type="number"
                value={previewAmount}
                onChange={(e) => setPreviewAmount(e.target.value)}
                placeholder="Contoh: 50000"
              />
            </div>

            <Separator />

            {generatedQR ? (
              <div className="text-center py-4 space-y-4">
                <div className="inline-block p-4 bg-white border-2 rounded-xl shadow-sm">
                  <img
                    src={generatedQR}
                    alt="QRIS Generated"
                    className="mx-auto w-64 h-64 object-contain"
                  />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    Rp {parseInt(previewAmount).toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Scan dengan aplikasi dompet digital untuk verifikasi
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setGeneratedQR(null);
                    setSelectedPayload(null);
                  }}
                >
                  Reset Preview
                </Button>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30 text-muted-foreground">
                <QrCode className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">Pilih "Test" pada salah satu QRIS</p>
                <p className="text-xs">untuk melihat preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
