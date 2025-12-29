# Online Order Mobile API Documentation

> **Document Version**: 1.0  
> **Last Updated**: 2025-12-29  
> **For**: PWA Developer Integration

---

## Base URL

```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

Semua request menggunakan **HTTP POST** dengan `Content-Type: application/json`.

---

## Quick Reference

| Action                   | Endpoint                | Auth Required |
| ------------------------ | ----------------------- | ------------- |
| `customerRegister`       | Registrasi pelanggan    | ❌ No         |
| `customerLogin`          | Login pelanggan         | ❌ No         |
| `getPublicProducts`      | Get daftar menu         | ❌ No         |
| `getPublicCategories`    | Get kategori menu       | ❌ No         |
| `createOnlineOrder`      | Buat pesanan baru       | ✅ Customer   |
| `getOnlineOrders`        | Get pesanan pelanggan   | ✅ Customer   |
| `getOrderTracking`       | Tracking status pesanan | ❌ No         |
| `updateOrderStatus`      | Update status (kasir)   | ✅ Staff      |
| `getPendingOnlineOrders` | Get antrian pesanan     | ✅ Staff      |
| `getCustomers`           | Get semua pelanggan     | ✅ Admin      |
| `updateCustomer`         | Update data pelanggan   | ✅ Admin      |
| `deleteCustomer`         | Hapus pelanggan         | ✅ Admin      |
| `toggleCustomerActive`   | Aktif/nonaktif akun     | ✅ Admin      |
| `resetCustomerPassword`  | Reset password          | ✅ Admin      |

---

## 1. Customer Authentication

### 1.1 Register

```http
POST /exec

{
  "action": "customerRegister",
  "name": "John Doe",
  "phone": "081234567890",
  "password": "securepass123",
  "email": "john@example.com",
  "address": "Jl. Contoh No.1"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "customer": {
    "id": "CUST-123456",
    "name": "John Doe",
    "phone": "081234567890",
    "email": "john@example.com"
  }
}
```

**Error Response:**

```json
{ "success": false, "message": "Nomor HP sudah terdaftar" }
```

---

### 1.2 Login

```http
POST /exec

{
  "action": "customerLogin",
  "phone": "081234567890",
  "password": "securepass123"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Login berhasil",
  "customer": {
    "id": "CUST-123456",
    "name": "John Doe",
    "phone": "081234567890",
    "email": "john@example.com",
    "address": "Jl. Contoh No.1"
  }
}
```

---

## 2. Menu (Public)

### 2.1 Get Products

```http
POST /exec

{ "action": "getPublicProducts" }
```

**Response:**

```json
{
  "items": [
    {
      "id": "1",
      "name": "Nasi Goreng Special",
      "category": "Food",
      "price": 25000,
      "stock": 45,
      "stockType": "STOK_FISIK",
      "available": true,
      "image": "https://..."
    }
  ]
}
```

### 2.2 Get Categories

```http
POST /exec

{ "action": "getPublicCategories" }
```

**Response:**

```json
{
  "categories": [
    { "name": "Food", "icon": "" },
    { "name": "Drinks", "icon": "" }
  ]
}
```

---

## 3. Online Order

### 3.1 Create Order

```http
POST /exec

{
  "action": "createOnlineOrder",
  "customerId": "CUST-123456",
  "customerName": "John Doe",
  "customerPhone": "081234567890",
  "items": [
    {
      "id": "1",
      "name": "Nasi Goreng Special",
      "qty": 2,
      "price": 25000,
      "note": "Pedas sedang"
    }
  ],
  "subtotal": 50000,
  "tax": 5500,
  "total": 55500,
  "paymentMethod": "QRIS",
  "notes": "Tolong dibungkus rapi"
}
```

**Payment Methods:** `COD` | `QRIS` | `TRANSFER`

**Response:**

```json
{
  "success": true,
  "message": "Pesanan berhasil dibuat",
  "order": {
    "orderId": "ONL-3456-1703847600000",
    "queueNumber": 15,
    "estimatedTime": 20,
    "paymentStatus": "PENDING",
    "orderStatus": "PENDING",
    "createdAt": "2024-12-29T10:00:00.000Z"
  }
}
```

---

### 3.2 Get Customer Orders

```http
POST /exec

{
  "action": "getOnlineOrders",
  "customerId": "CUST-123456"
}
```

**Response:**

```json
{
  "orders": [
    {
      "orderId": "ONL-3456-1703847600000",
      "items": [...],
      "total": 55500,
      "paymentMethod": "QRIS",
      "paymentStatus": "PAID",
      "orderStatus": "COOKING",
      "queueNumber": 15,
      "estimatedTime": 15,
      "createdAt": "2024-12-29T10:00:00.000Z"
    }
  ]
}
```

---

### 3.3 Track Order

```http
POST /exec

{
  "action": "getOrderTracking",
  "orderId": "ONL-3456-1703847600000"
}
```

**Response:**

```json
{
  "success": true,
  "order": {
    "orderId": "ONL-3456-1703847600000",
    "orderStatus": "COOKING",
    "paymentStatus": "PAID",
    "queueNumber": 15,
    "estimatedTime": 10,
    "total": 55500,
    "createdAt": "2024-12-29T10:00:00.000Z",
    "updatedAt": "2024-12-29T10:05:00.000Z"
  }
}
```

---

## 4. Order Management (Staff Only)

### 4.1 Update Order Status

```http
POST /exec

{
  "action": "updateOrderStatus",
  "orderId": "ONL-3456-1703847600000",
  "orderStatus": "COOKING",
  "paymentStatus": "PAID",
  "estimatedTime": 15
}
```

**Order Status Flow:**

```
PENDING → CONFIRMED → COOKING → READY → COMPLETED
                                      ↘ CANCELLED
```

**Payment Status:** `PENDING` | `PAID` | `FAILED`

---

### 4.2 Get Pending Orders

```http
POST /exec

{ "action": "getPendingOnlineOrders" }
```

Returns all active orders (PENDING, CONFIRMED, COOKING, READY).

---

## Status Codes

| Order Status | Description                       |
| ------------ | --------------------------------- |
| `PENDING`    | Pesanan baru, menunggu konfirmasi |
| `CONFIRMED`  | Dikonfirmasi kasir                |
| `COOKING`    | Sedang diproses                   |
| `READY`      | Siap diambil                      |
| `COMPLETED`  | Selesai                           |
| `CANCELLED`  | Dibatalkan                        |

| Payment Status | Description         |
| -------------- | ------------------- |
| `PENDING`      | Menunggu pembayaran |
| `PAID`         | Sudah dibayar       |
| `FAILED`       | Pembayaran gagal    |

---

## Error Handling

All errors return:

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Implementation Notes

1. **Polling untuk Notifikasi**: Gunakan `getOrderTracking` setiap 10-30 detik untuk update status real-time.

2. **Queue Number**: Reset setiap hari mulai dari 1.

3. **Estimated Time**: Otomatis dihitung berdasarkan jumlah item (min 20 menit).

4. **Stock Update**: Stock produk otomatis berkurang saat order dibuat.
