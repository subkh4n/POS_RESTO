# QRIS Module - Midtrans Integration

Modul pembayaran QRIS menggunakan Midtrans Snap untuk sistem POS.

## Struktur File

```
modules/qris/
├── index.ts              # Export utama
├── types.ts              # Type definitions
├── config.ts             # Konfigurasi Midtrans
├── utils.ts              # Utility functions
├── QrisPaymentModal.tsx  # Modal pembayaran dengan Midtrans Snap
└── README.md             # Dokumentasi
```

## Setup

### 1. Konfigurasi Midtrans

1. Daftar di [Midtrans Dashboard](https://dashboard.midtrans.com)
2. Dapatkan **Client Key** dan **Server Key** dari menu Settings > Access Keys

### 2. Update index.html

Script Midtrans sudah ditambahkan di `index.html`. Ganti `YOUR_CLIENT_KEY`:

```html
<script
  src="https://app.sandbox.midtrans.com/snap/snap.js"
  data-client-key="YOUR_CLIENT_KEY"
></script>
```

### 3. Update Code.gs (Backend)

Ganti `MIDTRANS_SERVER_KEY` di `backend/Code.gs`:

```javascript
const MIDTRANS_SERVER_KEY = "YOUR_SERVER_KEY_HERE";
```

### 4. Deploy Google Apps Script

1. Buka Google Apps Script Editor
2. Klik **Deploy > New Deployment**
3. Pilih **Web App**
4. Execute as: **Me**
5. Who has access: **Anyone** (untuk menerima webhook Midtrans)
6. Copy **Web App URL** dan set sebagai `VITE_GOOGLE_SCRIPT_URL`

### 5. Setup Midtrans Webhook

1. Buka Midtrans Dashboard > Settings > Payment Notification URL
2. Masukkan **Web App URL** dari langkah sebelumnya

## Penggunaan

```tsx
import { QrisPaymentModal } from "./modules/qris";

function PaymentPage() {
  const [showQris, setShowQris] = useState(false);

  return (
    <>
      <button onClick={() => setShowQris(true)}>Bayar dengan QRIS</button>

      <QrisPaymentModal
        isOpen={showQris}
        amount={50000}
        orderId="ORD-12345"
        customerName="Budi"
        onClose={() => setShowQris(false)}
        onPaymentSuccess={(txId) => {
          console.log("Berhasil:", txId);
          setShowQris(false);
        }}
      />
    </>
  );
}
```

## Alur Pembayaran

1. **User klik bayar QRIS** → Modal terbuka
2. **React request token** → Google Apps Script → Midtrans API
3. **Midtrans Snap popup** → Menampilkan QR Code QRIS
4. **User scan QR** → Bayar via e-wallet (GoPay, OVO, DANA, dll)
5. **Midtrans webhook** → Update status di Google Sheets
6. **Callback success** → onPaymentSuccess dipanggil

## Testing (Sandbox)

Gunakan [Midtrans Payment Simulator](https://simulator.sandbox.midtrans.com/) untuk test pembayaran tanpa uang asli.

## Catatan Keamanan

- **Server Key** HANYA disimpan di backend (Code.gs), TIDAK di frontend
- **Client Key** aman untuk diexpose di frontend
- Webhook URL harus bisa diakses publik oleh Midtrans
