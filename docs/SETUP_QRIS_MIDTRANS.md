# Panduan Setup QRIS - Google Sheets & Midtrans

## Langkah 1: Setup Midtrans Dashboard

### 1.1 Daftar Akun Midtrans

1. Buka https://dashboard.midtrans.com
2. Klik **Register** dan isi data
3. Verifikasi email Anda

### 1.2 Dapatkan API Keys

1. Login ke Dashboard Midtrans
2. Pilih **Environment: Sandbox** (untuk testing)
3. Pergi ke **Settings > Access Keys**
4. Catat:
   - **Client Key**: `SB-Mid-client-xxxxxxxx` (untuk frontend)
   - **Server Key**: `SB-Mid-server-xxxxxxxx` (untuk backend)

### 1.3 Konfigurasi Payment

1. Pergi ke **Settings > Snap Preferences**
2. Di bagian **Enabled Payments**, pastikan **QRIS** aktif
3. Atur **Theme** sesuai keinginan (opsional)

---

## Langkah 2: Setup Google Sheets

### 2.1 Buka Google Sheet POS Anda

1. Buka Google Sheet yang sudah digunakan untuk POS
2. Pastikan sudah ada sheet: `Products`, `Transactions`, `Transaction_Details`

### 2.2 Deploy Apps Script

1. Klik menu **Extensions > Apps Script**
2. Di Apps Script Editor:

   **Tambahkan file baru:**

   - Klik tombol **+** di sebelah "Files"
   - Pilih **Script**
   - Rename menjadi `qris` (akan jadi `qris.gs`)
   - Copy-paste isi dari file `backend/qris.gs`

3. **Update Server Key** di `qris.gs`:

   ```javascript
   const MIDTRANS_SERVER_KEY = "SB-Mid-server-xxxxxxxx"; // Ganti dengan Server Key Anda
   ```

4. **Deploy:**
   - Klik **Deploy > New Deployment**
   - Klik ikon ⚙️, pilih **Web app**
   - Isi:
     - Description: `POS API v3.6 with QRIS`
     - Execute as: **Me**
     - Who has access: **Anyone** ⚠️ (penting agar Midtrans bisa kirim webhook)
   - Klik **Deploy**
   - Copy **Web App URL** yang muncul

### 2.3 Authorize Permissions

1. Saat pertama deploy, akan muncul popup authorization
2. Klik **Review Permissions**
3. Pilih akun Google Anda
4. Klik **Advanced > Go to (project name)**
5. Klik **Allow**

---

## Langkah 3: Setup Webhook Midtrans

### 3.1 Set Payment Notification URL

1. Kembali ke **Midtrans Dashboard**
2. Pergi ke **Settings > Configuration**
3. Di bagian **Payment Notification URL**:
   - Paste **Web App URL** dari langkah 2.2
   - Contoh: `https://script.google.com/macros/s/AKfycbxxxxxx/exec`
4. Klik **Save**

### 3.2 Test Webhook (Opsional)

1. Di halaman yang sama, klik **Send Test Notification**
2. Jika berhasil, status akan muncul "Success"

---

## Langkah 4: Update Frontend

### 4.1 Update Client Key di index.html

Buka `index.html` dan ganti `YOUR_CLIENT_KEY`:

```html
<script
  src="https://app.sandbox.midtrans.com/snap/snap.js"
  data-client-key="SB-Mid-client-xxxxxxxx"
></script>
```

### 4.2 Pastikan Google Script URL Sudah Benar

Di file `.env.local` atau `constants.ts`, pastikan URL Google Script sudah terupdate:

```
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxxxxxx/exec
```

---

## Langkah 5: Testing

### 5.1 Test Pembayaran QRIS

1. Jalankan aplikasi POS (`npm run dev`)
2. Tambahkan item ke keranjang
3. Pilih metode pembayaran **QRIS**
4. Popup Midtrans Snap akan muncul dengan QR Code
5. Gunakan **Midtrans Simulator** untuk test scan

### 5.2 Gunakan Midtrans Simulator

1. Buka https://simulator.sandbox.midtrans.com/qris/index
2. Scan QR Code yang muncul di popup, atau
3. Input Order ID yang muncul di QR
4. Klik **Pay** untuk simulasi pembayaran berhasil

### 5.3 Verifikasi di Google Sheets

1. Buka Google Sheet Anda
2. Cek sheet **QRIS_Transactions** (akan dibuat otomatis)
3. Status harusnya berubah dari `PENDING` ke `LUNAS`

---

## Struktur Sheet QRIS_Transactions

Sheet ini akan dibuat otomatis saat transaksi QRIS pertama:

| Order ID    | Amount | Token    | Status | Created At       | Paid At          |
| ----------- | ------ | -------- | ------ | ---------------- | ---------------- |
| QRIS-123456 | 50000  | snap-xxx | LUNAS  | 24/12/2024 17:00 | 24/12/2024 17:02 |

---

## Troubleshooting

### Error: "Midtrans Snap tidak tersedia"

- Pastikan script Midtrans sudah dimuat di `index.html`
- Periksa Client Key sudah benar

### Error: "Gagal membuat transaksi QRIS"

- Periksa Server Key di `qris.gs`
- Pastikan Web App sudah di-deploy dengan akses "Anyone"

### Webhook tidak update status

- Pastikan Web App URL sudah diset di Midtrans Dashboard
- Test webhook dari Midtrans Dashboard

### Status tetap PENDING

- Gunakan Midtrans Simulator untuk test
- Periksa log di Apps Script (View > Executions)

---

## Mode Production

Saat siap go-live:

1. **Midtrans Dashboard:**

   - Ubah Environment ke **Production**
   - Lengkapi proses aktivasi akun
   - Dapatkan Production Keys

2. **index.html:**

   ```html
   <script
     src="https://app.midtrans.com/snap/snap.js"
     data-client-key="Mid-client-xxxxxxxx"
   ></script>
   ```

3. **qris.gs:**

   ```javascript
   const MIDTRANS_SERVER_KEY = "Mid-server-xxxxxxxx";
   const MIDTRANS_IS_PRODUCTION = true;
   ```

4. Deploy ulang Apps Script
