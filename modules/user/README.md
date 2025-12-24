# User Module - Autentikasi & Manajemen Pengguna

Modul untuk login, logout, dan manajemen user pada sistem POS.

## Struktur File

```
modules/user/
├── index.ts         # Export utama
├── types.ts         # Type definitions
├── AuthContext.tsx  # Context untuk state auth global
├── LoginForm.tsx    # Komponen form login
├── UserDashboard.tsx# Dashboard profil user
└── README.md

backend/
└── user.gs          # Backend untuk auth & user management
```

## Penggunaan

### 1. Wrap App dengan AuthProvider

```tsx
import { AuthProvider } from "./modules/user";

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

### 2. Gunakan useAuth Hook

```tsx
import { useAuth, LoginForm, UserDashboard } from "./modules/user";

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={() => console.log("Logged in!")} />;
  }

  return <UserDashboard />;
}
```

## User Roles

| Role      | Akses                    |
| --------- | ------------------------ |
| `ADMIN`   | Full access, kelola user |
| `MANAGER` | Laporan, settings        |
| `KASIR`   | POS only                 |

## Default Users

Saat sheet `Users` pertama kali dibuat:

| Username | Password | Role  |
| -------- | -------- | ----- |
| admin    | admin123 | ADMIN |
| kasir    | kasir123 | KASIR |

⚠️ **Ganti password default di production!**

## Google Sheet Users

Kolom di sheet `Users`:

- id, username, password, name, role
- email, phone, avatar
- created_at, last_login, is_active
