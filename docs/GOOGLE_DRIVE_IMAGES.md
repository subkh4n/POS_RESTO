# Panduan Mengambil Gambar dari Google Drive

> **Document Version**: 1.0  
> **Last Updated**: 2025-12-29  
> **For**: Developer & Content Integration

---

## Overview

Dokumen ini menjelaskan berbagai cara untuk menampilkan gambar yang disimpan di Google Drive pada aplikasi web atau dokumentasi.

---

## Metode 1: Direct Link dengan Format Khusus (Recommended)

### Langkah-langkah:

1. **Upload gambar ke Google Drive**

2. **Share gambar** → Klik kanan → "Get link" → Pilih **"Anyone with the link"**

3. **Copy File ID** dari URL:

   ```
   https://drive.google.com/file/d/FILE_ID_DISINI/view?usp=sharing
                                   ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
   ```

4. **Gunakan format URL berikut:**

   ```
   https://drive.google.com/uc?export=view&id=FILE_ID
   ```

### Contoh Penggunaan:

**Original URL:**

```
https://drive.google.com/file/d/1ABC123xyz789/view?usp=sharing
```

**Converted URL:**

```
https://drive.google.com/uc?export=view&id=1ABC123xyz789
```

**Dalam HTML:**

```html
<img
  src="https://drive.google.com/uc?export=view&id=1ABC123xyz789"
  alt="Gambar"
/>
```

**Dalam React/JSX:**

```jsx
<img
  src="https://drive.google.com/uc?export=view&id=1ABC123xyz789"
  alt="Product image"
  style={{ width: "200px", height: "200px", objectFit: "cover" }}
/>
```

**Dalam Markdown:**

```markdown
![Deskripsi Gambar](https://drive.google.com/uc?export=view&id=FILE_ID)
```

---

## Metode 2: Thumbnail Link (Untuk Gambar Kecil)

Jika membutuhkan thumbnail dengan ukuran tertentu:

```
https://drive.google.com/thumbnail?id=FILE_ID&sz=w400
```

**Parameter `sz`:**

- `sz=w200` - Lebar 200px
- `sz=w400` - Lebar 400px
- `sz=w800` - Lebar 800px
- `sz=s400` - Square 400x400px

**Contoh:**

```html
<img
  src="https://drive.google.com/thumbnail?id=1ABC123xyz789&sz=w300"
  alt="Thumbnail"
/>
```

---

## Metode 3: Menggunakan Google Apps Script (Backend)

Untuk upload dan mengambil gambar via API:

### Upload Image ke Drive:

```javascript
function uploadImage(base64Data, fileName, folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data.split(",")[1]),
    "image/png",
    fileName
  );

  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileId = file.getId();
  const imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

  return {
    success: true,
    fileId: fileId,
    imageUrl: imageUrl,
  };
}
```

### Get Image URL dari File ID:

```javascript
function getImageUrl(fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}
```

---

## Metode 4: Folder Publik dengan Listing

Jika memiliki folder dengan banyak gambar:

### Setup Folder Publik:

1. Buat folder di Google Drive
2. Share folder → "Anyone with the link" → Viewer

### Script untuk List Images:

```javascript
function listImagesInFolder(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFilesByType(MimeType.PNG);
  const images = [];

  while (files.hasNext()) {
    const file = files.next();
    images.push({
      id: file.getId(),
      name: file.getName(),
      url: `https://drive.google.com/uc?export=view&id=${file.getId()}`,
    });
  }

  return images;
}
```

---

## Tips & Best Practices

### ✅ Do's:

| Praktik                           | Alasan                              |
| --------------------------------- | ----------------------------------- |
| Gunakan format `uc?export=view`   | Lebih stabil untuk embedding        |
| Set sharing ke "Anyone with link" | Diperlukan agar gambar bisa diakses |
| Simpan File ID di database        | Lebih fleksibel untuk generate URL  |
| Gunakan thumbnail untuk preview   | Lebih cepat loading                 |
| Compress gambar sebelum upload    | Hemat bandwidth                     |

### ❌ Don'ts:

| Hindari                                 | Alasan                   |
| --------------------------------------- | ------------------------ |
| Gunakan URL `/file/d/.../view` langsung | Tidak bisa di-embed      |
| Share gambar sebagai "Restricted"       | Gambar tidak akan tampil |
| Upload file >10MB                       | Loading lambat           |
| Hardcode URL di frontend                | Susah maintain           |

---

## Troubleshooting

### Gambar Tidak Muncul

1. **Cek Sharing Permission:**
   - Pastikan sudah di-share sebagai "Anyone with the link"
2. **Cek Format URL:**

   - Pastikan menggunakan format `uc?export=view&id=`

3. **Cek CORS (jika via JavaScript):**
   - Google Drive memiliki CORS restriction
   - Gunakan backend proxy jika perlu

### Error 403 Forbidden

```
❌ Sharing belum diaktifkan
✅ Share gambar ke "Anyone with the link"
```

### Gambar Blur / Kualitas Rendah

```
❌ Menggunakan thumbnail size kecil
✅ Gunakan format uc?export=view untuk full resolution
```

---

## Quick Reference

| Kebutuhan       | URL Format                                              |
| --------------- | ------------------------------------------------------- |
| Full Image      | `https://drive.google.com/uc?export=view&id=FILE_ID`    |
| Thumbnail 200px | `https://drive.google.com/thumbnail?id=FILE_ID&sz=w200` |
| Thumbnail 400px | `https://drive.google.com/thumbnail?id=FILE_ID&sz=w400` |
| Square 300x300  | `https://drive.google.com/thumbnail?id=FILE_ID&sz=s300` |

---

## Contoh Implementasi di Project Ini

### Di `Products` Sheet (Google Sheets):

Column `image` berisi URL format:

```
https://drive.google.com/uc?export=view&id=1ABC123xyz789
```

### Di Frontend (React):

```tsx
interface Product {
  id: string;
  name: string;
  image: string; // URL dari Google Drive
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="product-card">
      <img
        src={product.image || "/placeholder.png"}
        alt={product.name}
        onError={(e) => {
          e.currentTarget.src = "/placeholder.png";
        }}
      />
      <h3>{product.name}</h3>
    </div>
  );
}
```

---

## Related Documentation

- [ONLINE_ORDER_API.md](./ONLINE_ORDER_API.md) - API untuk produk dengan image
- [SETUP_USER_AUTH.md](./SETUP_USER_AUTH.md) - Setup autentikasi
