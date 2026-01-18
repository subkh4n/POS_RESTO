# 🛠️ Tech Stack - POS RESTO

> Dokumentasi teknologi yang digunakan dalam proyek **Foodcourt POS System**

---

## 📦 Frontend

| Teknologi        | Versi    | Fungsi                                    |
| ---------------- | -------- | ----------------------------------------- |
| **React**        | ^19.2.3  | Library UI utama untuk membangun komponen |
| **TypeScript**   | ~5.8.2   | Superset JavaScript dengan static typing  |
| **Vite**         | ^6.2.0   | Build tool & dev server yang sangat cepat |
| **Lucide React** | ^0.562.0 | Icon library modern berbasis SVG          |

---

## 🎨 Styling

| Teknologi         | Keterangan                          |
| ----------------- | ----------------------------------- |
| **Vanilla CSS**   | Custom CSS murni di `index.css`     |
| **CSS Variables** | Untuk theming dan konsistensi warna |

---

## 🔧 Development Tools

| Tool                     | Fungsi                                      |
| ------------------------ | ------------------------------------------- |
| **@vitejs/plugin-react** | Plugin Vite untuk React dengan Fast Refresh |
| **@types/node**          | TypeScript definitions untuk Node.js        |
| **ES2022**               | JavaScript target modern                    |

---

## ☁️ Backend & API

| Teknologi              | Fungsi                                 |
| ---------------------- | -------------------------------------- |
| **Google Apps Script** | Backend serverless via Google Sheets   |
| **Google Sheets**      | Database untuk produk, transaksi, user |
| **REST API**           | Komunikasi frontend-backend via fetch  |

### 📁 File Backend:

- `backend/Code.gs` - Logika bisnis utama
- `backend/user.gs` - Manajemen user & autentikasi
- `backend/online_order.gs` - Pesanan online

---

## 🚀 Deployment

| Platform                  | Keterangan             |
| ------------------------- | ---------------------- |
| **Vercel**                | Hosting frontend (SPA) |
| **Vercel Speed Insights** | Monitoring performa    |

### Konfigurasi Vercel:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## 📁 Struktur Folder

```
POS_RESTO/
├── 📄 App.tsx          # Komponen utama
├── 📄 index.tsx        # Entry point
├── 📄 types.ts         # TypeScript types
├── 📄 constants.ts     # Konstanta & konfigurasi
│
├── 📂 components/      # Komponen UI
│   ├── ui/             # Komponen dasar (button, input, dll)
│   ├── OrderPanel.tsx  # Panel pesanan
│   ├── Sidebar.tsx     # Navigasi samping
│   └── ...
│
├── 📂 modules/         # Fitur modular
│   └── user/           # Modul autentikasi
│       ├── LoginForm.tsx
│       └── AuthContext.tsx
│
├── 📂 services/        # API layer
│   └── api.ts          # Fungsi fetch ke backend
│
├── 📂 hooks/           # Custom React hooks
├── 📂 contexts/        # React Context providers
├── 📂 views/           # Halaman/views
├── 📂 utils/           # Utility functions
├── 📂 styles/          # File CSS tambahan
└── 📂 backend/         # Google Apps Script
```

---

## 🔌 Integrasi API

### Endpoint Tersedia:

| Action            | Method | Deskripsi               |
| ----------------- | ------ | ----------------------- |
| `getProducts`     | GET    | Ambil daftar produk     |
| `getCategories`   | GET    | Ambil kategori          |
| `getModifiers`    | GET    | Ambil modifier items    |
| `getTransactions` | GET    | Ambil riwayat transaksi |
| `addOrder`        | POST   | Simpan pesanan baru     |
| `addProduct`      | POST   | Tambah produk           |
| `updateProduct`   | POST   | Update produk           |
| `deleteProduct`   | POST   | Hapus produk            |
| `adjustStock`     | POST   | Sesuaikan stok          |

---

## 🔐 Environment Variables

| Variable         | Fungsi                            |
| ---------------- | --------------------------------- |
| `GEMINI_API_KEY` | API key untuk integrasi Gemini AI |

File: `.env.local`

---

## 📝 NPM Scripts

```bash
# Development server (port 3000)
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

---

## ✨ Fitur Utama

- ✅ **Point of Sale** - Kasir & transaksi
- ✅ **Manajemen Produk** - CRUD produk & stok
- ✅ **Manajemen Pesanan** - Online & offline
- ✅ **Laporan Keuangan** - Reports & analytics
- ✅ **Multi-user** - Login & role management
- ✅ **Responsive Design** - Desktop optimized

---

> 📅 **Last Updated**: Januari 2026
