# Panduan Setup User Authentication

## Langkah 1: Setup Google Apps Script

### 1.1 Tambahkan File user.gs

1. Buka Google Sheet POS Anda
2. Klik **Extensions > Apps Script**
3. Di Apps Script Editor:
   - Klik tombol **+** di sebelah "Files"
   - Pilih **Script**
   - Rename menjadi `user` (akan jadi `user.gs`)
   - Copy-paste isi dari file `backend/user.gs`

### 1.2 Deploy Ulang

1. Klik **Deploy > Manage Deployments**
2. Klik ikon pensil (Edit)
3. Di "Version", pilih **New version**
4. Klik **Deploy**

> Sheet `Users` akan otomatis dibuat saat login pertama kali.

---

## Langkah 2: Setup Frontend

### 2.1 Wrap App dengan AuthProvider

Edit file `App.tsx`:

```tsx
import { AuthProvider } from "./modules/user";

function App() {
  return <AuthProvider>{/* Komponen aplikasi Anda */}</AuthProvider>;
}
```

### 2.2 Tambahkan Logic Login

Contoh penggunaan di App.tsx:

```tsx
import { AuthProvider, useAuth, LoginForm } from "./modules/user";

function MainApp() {
  const { isAuthenticated, user } = useAuth();

  // Jika belum login, tampilkan form login
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Jika sudah login, tampilkan aplikasi POS
  return (
    <div>
      <p>Selamat datang, {user?.name}!</p>
      {/* Komponen POS Anda */}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
```

---

## Langkah 3: Testing

### 3.1 Test Login

1. Jalankan aplikasi (`npm run dev`)
2. Akan muncul halaman login
3. Login dengan:
   - **Username:** `admin`
   - **Password:** `admin123`

### 3.2 Cek Google Sheets

1. Buka Google Sheet Anda
2. Akan muncul sheet baru **Users** dengan data:

| id      | username | password | name          | role  | ... |
| ------- | -------- | -------- | ------------- | ----- | --- |
| USR-001 | admin    | admin123 | Administrator | ADMIN | ... |
| USR-002 | kasir    | kasir123 | Kasir Utama   | KASIR | ... |

---

## Langkah 4: Kustomisasi (Opsional)

### 4.1 Ganti Password Default

Di Google Sheets, edit kolom `password` untuk user admin dan kasir.

### 4.2 Tambah User Baru

Tambahkan row baru di sheet `Users`:

- **id:** `USR-003` (unique)
- **username:** username baru
- **password:** password
- **name:** Nama lengkap
- **role:** `ADMIN`, `MANAGER`, atau `KASIR`
- **is_active:** `TRUE`

### 4.3 Role & Akses

| Role      | Akses                     |
| --------- | ------------------------- |
| `ADMIN`   | Full access + kelola user |
| `MANAGER` | Laporan + pengaturan      |
| `KASIR`   | POS / kasir saja          |

---

## Fitur yang Tersedia

### Hook `useAuth()`

```tsx
const {
  isAuthenticated, // boolean - status login
  user, // User object atau null
  isLoading, // boolean - loading state
  error, // string atau null
  login, // function(credentials)
  logout, // function()
} = useAuth();
```

### Komponen

1. **LoginForm** - Form login lengkap
2. **UserDashboard** - Dashboard profil user

---

## Troubleshooting

### Error "Username tidak ditemukan"

- Pastikan sheet `Users` sudah ada
- Cek username benar (case-sensitive)

### Error "Akun tidak aktif"

- Cek kolom `is_active` di sheet, pastikan `TRUE`

### Session expired

- Session berlaku 8 jam
- User perlu login ulang setelah expired
