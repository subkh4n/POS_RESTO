/**
 * Google Apps Script Backend for FoodCourt POS
 * v3.5 - Indonesian Labels & Custom Allocation per Item
 */

function doGet(e) {
  try {
    if (!e || !e.parameter)
      return createJsonResponse({ status: "ok", message: "API is running." });
    const action = e.parameter.action;
    if (action === "getProducts") return getProducts();
    if (action === "getCategories") return getCategories();
    if (action === "getTransactions") return getTransactions();
    if (action === "getTransactionDetails")
      return getTransactionDetails(e.parameter.id);
    return createJsonResponse({ status: "error", message: "Invalid action" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    const contents = e.postData.contents;
    if (!contents)
      return createJsonResponse({
        success: false,
        message: "No content provided",
      });

    const data = JSON.parse(contents);
    const action = data.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "addOrder") {
      let sheetTrans =
        ss.getSheetByName("Transactions") || ss.insertSheet("Transactions");
      const timestamp = new Date();

      sheetTrans.appendRow([
        String(data.orderId),
        timestamp,
        data.subtotal,
        data.tax,
        data.total,
        data.cashReceived,
        data.change,
        data.orderType,
        data.tableNumber,
        "Kasir Utama",
        data.paymentMethod,
      ]);

      let sheetDetails =
        ss.getSheetByName("Transaction_Details") ||
        ss.insertSheet("Transaction_Details");
      data.items.forEach((item, index) => {
        // Kolom Transaction_Details:
        // A:orderId, B:index, C:productId, D:name, E:qty, F:price, G:note, H:totalPrice, I:allocation
        sheetDetails.appendRow([
          String(data.orderId),
          index + 1,
          item.id,
          item.name,
          item.qty,
          item.price,
          item.note,
          item.price * item.qty,
          item.allocation || "Umum",
        ]);
      });

      updateProductStock(data.items);
      return createJsonResponse({
        success: true,
        message: "Transaksi Berhasil",
      });
    }

    if (action === "updateTransaction") {
      let sheetTrans = ss.getSheetByName("Transactions");
      if (!sheetTrans || sheetTrans.getLastRow() < 2)
        return createJsonResponse({
          success: false,
          message: "Data tidak ditemukan",
        });
      const rows = sheetTrans.getDataRange().getDisplayValues();
      const targetId = String(data.id).trim();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0].trim() === targetId) {
          sheetTrans.getRange(i + 1, 8).setValue(data.orderType);
          sheetTrans.getRange(i + 1, 9).setValue(data.tableNumber);
          sheetTrans.getRange(i + 1, 11).setValue(data.paymentMethod);
          return createJsonResponse({
            success: true,
            message: "Berhasil diperbarui",
          });
        }
      }
      return createJsonResponse({
        success: false,
        message: "ID tidak ditemukan",
      });
    }

    if (action === "deleteTransaction") {
      let sheetTrans = ss.getSheetByName("Transactions");
      if (!sheetTrans || sheetTrans.getLastRow() < 2)
        return createJsonResponse({
          success: false,
          message: "Database kosong",
        });
      const rows = sheetTrans.getDataRange().getDisplayValues();
      const targetId = String(data.id).trim();
      let deleteCount = 0;
      for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][0].trim() === targetId) {
          sheetTrans.deleteRow(i + 1);
          deleteTransactionDetails(targetId);
          deleteCount++;
        }
      }
      return deleteCount > 0
        ? createJsonResponse({ success: true, message: "Terhapus" })
        : createJsonResponse({ success: false, message: "ID tidak ditemukan" });
    }

    if (action === "addProduct") {
      let sheetProd =
        ss.getSheetByName("Products") || ss.insertSheet("Products");
      // Hanya kolom A-H (PriceType dihapus)
      sheetProd.appendRow([
        data.id,
        data.name,
        data.category,
        data.price,
        data.stock,
        data.stockType,
        data.available,
        data.image,
      ]);

      // Log stock change for new product
      if (data.stockType === "STOK_FISIK" && data.stock > 0) {
        logStockChange(
          ss,
          data.id,
          data.name,
          "UPLOAD_PRODUCT",
          data.stock,
          "Menu baru diunggah oleh admin"
        );
      }

      return createJsonResponse({ success: true });
    }

    if (action === "updateProduct") {
      let sheetProd = ss.getSheetByName("Products");
      if (!sheetProd || sheetProd.getLastRow() < 2)
        return createJsonResponse({ success: false });
      const rows = sheetProd.getDataRange().getDisplayValues();
      const targetId = String(data.id).trim();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0].trim() === targetId) {
          const oldStock = Number(rows[i][4]) || 0;
          const newStock = Number(data.stock) || 0;
          const stockDiff = newStock - oldStock;

          // Set range B-H
          sheetProd
            .getRange(i + 1, 2, 1, 7)
            .setValues([
              [
                data.name,
                data.category,
                data.price,
                data.stock,
                data.stockType,
                data.available,
                data.image,
              ],
            ]);

          // Log stock change if stock was updated
          if (data.stockType === "STOK_FISIK" && stockDiff !== 0) {
            logStockChange(
              ss,
              data.id,
              data.name,
              "UPDATE_STOCK",
              stockDiff,
              "Update data barang via Item Management"
            );
          }

          return createJsonResponse({ success: true });
        }
      }
      return createJsonResponse({ success: false });
    }

    if (action === "deleteProduct") {
      let sheetProd = ss.getSheetByName("Products");
      if (!sheetProd || sheetProd.getLastRow() < 2)
        return createJsonResponse({
          success: false,
          message: "Database kosong",
        });
      const rows = sheetProd.getDataRange().getDisplayValues();
      const targetId = String(data.id).trim();
      for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][0].trim() === targetId) {
          sheetProd.deleteRow(i + 1);
          return createJsonResponse({
            success: true,
            message: "Produk terhapus",
          });
        }
      }
      return createJsonResponse({
        success: false,
        message: "ID produk tidak ditemukan",
      });
    }

    if (action === "uploadImage") {
      const result = uploadImageToDrive(data.base64, data.filename);
      return createJsonResponse(result);
    }

    // New: adjustStock action for stock management
    if (action === "adjustStock") {
      let sheetProd = ss.getSheetByName("Products");
      if (!sheetProd || sheetProd.getLastRow() < 2)
        return createJsonResponse({
          success: false,
          message: "Database produk kosong",
        });

      const rows = sheetProd.getDataRange().getDisplayValues();
      const targetId = String(data.productId).trim();
      const quantity = Number(data.quantity) || 0;
      const actionType = data.actionType; // STOCK_IN, STOCK_OUT, ADJUSTMENT
      const notes = data.notes || "";

      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0].trim() === targetId) {
          const currentStock = Number(rows[i][4]) || 0;
          const productName = rows[i][1];
          let newStock = currentStock;
          let stockDiff = 0;

          // Calculate new stock based on action type
          if (actionType === "STOCK_IN") {
            newStock = currentStock + quantity;
            stockDiff = quantity;
          } else if (actionType === "STOCK_OUT") {
            newStock = currentStock - quantity;
            stockDiff = -quantity;
            // Prevent negative stock
            if (newStock < 0) {
              return createJsonResponse({
                success: false,
                message:
                  "Stok tidak boleh kurang dari 0. Stok saat ini: " +
                  currentStock,
              });
            }
          } else if (actionType === "ADJUSTMENT") {
            // For adjustment, quantity is the target stock value
            newStock = quantity;
            stockDiff = quantity - currentStock;
          }

          // Only update if there's a change
          if (stockDiff === 0 && actionType !== "ADJUSTMENT") {
            return createJsonResponse({
              success: true,
              newStock: currentStock,
              message: "Tidak ada perubahan stok",
            });
          }

          // Update stock in Products sheet
          sheetProd.getRange(i + 1, 5).setValue(newStock);

          // Log the stock change
          logStockChange(
            ss,
            targetId,
            productName,
            actionType,
            stockDiff,
            notes
          );

          return createJsonResponse({
            success: true,
            newStock: newStock,
            message: "Stok berhasil diperbarui",
          });
        }
      }

      return createJsonResponse({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    return createJsonResponse({
      success: false,
      message: "Aksi tidak dikenal",
    });
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: "Server Error: " + error.toString(),
    });
  }
}

function deleteTransactionDetails(orderId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transaction_Details");
  if (!sheet || sheet.getLastRow() < 2) return;
  const rows = sheet.getDataRange().getDisplayValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0].trim() === String(orderId).trim()) sheet.deleteRow(i + 1);
  }
}

/**
 * Log stock changes to Stock_Log sheet
 * Sheet structure: A=timestamp, B=product_id, C=product_name, D=action_type, E=stock_value, F=notes
 */
function logStockChange(
  ss,
  productId,
  productName,
  actionType,
  stockValue,
  notes
) {
  try {
    let logSheet = ss.getSheetByName("Stock_Log");
    if (!logSheet) {
      logSheet = ss.insertSheet("Stock_Log");
      // Add header row
      logSheet.appendRow([
        "timestamp",
        "product_id",
        "product_name",
        "action_type",
        "stock_value",
        "notes",
      ]);
    }

    const timestamp = new Date();
    logSheet.appendRow([
      timestamp,
      String(productId),
      productName,
      actionType,
      stockValue,
      notes || "",
    ]);
  } catch (error) {
    // Silently fail - don't break main operation if logging fails
    console.log("Stock log error: " + error.toString());
  }
}

function updateProductStock(items) {
  // Validasi items agar tidak error jika undefined
  if (!items || !Array.isArray(items) || items.length === 0) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Products");
  if (!sheet || sheet.getLastRow() < 2) return;
  const data = sheet.getDataRange().getDisplayValues();
  items.forEach((item) => {
    for (let i = 1; i < data.length; i++) {
      if (
        data[i][0].trim() === String(item.id).trim() &&
        data[i][5] == "STOK_FISIK"
      ) {
        const currentStock = Number(data[i][4]);
        const newStock = currentStock - item.qty;
        sheet.getRange(i + 1, 5).setValue(newStock);

        // Log SALE_OUT to Stock_Log
        logStockChange(
          ss,
          item.id,
          data[i][1],
          "SALE_OUT",
          -item.qty,
          "Penjualan via POS"
        );
      }
    }
  });
}

function getProducts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Products");
  if (!sheet || sheet.getLastRow() < 2)
    return createJsonResponse({ items: [] });
  const rows = sheet.getDataRange().getValues();
  return createJsonResponse({
    items: rows.slice(1).map((row) => ({
      id: String(row[0]),
      name: row[1],
      category: row[2],
      price: Number(row[3]),
      stock: Number(row[4]),
      stockType: row[5],
      available: row[6] === true || row[6] === "TRUE",
      image: row[7],
    })),
  });
}

function getTransactions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transactions");
  if (!sheet || sheet.getLastRow() < 2)
    return createJsonResponse({ transactions: [] });
  const rows = sheet.getDataRange().getValues();
  return createJsonResponse({
    transactions: rows
      .slice(1)
      .map((row) => ({
        id: String(row[0]),
        timestamp: row[1],
        subtotal: Number(row[2]),
        tax: Number(row[3]),
        total: Number(row[4]),
        cashReceived: Number(row[5]),
        change: Number(row[6]),
        orderType: row[7],
        tableNumber: row[8],
        cashier: row[9],
        paymentMethod: row[10],
      }))
      .reverse(),
  });
}

function getTransactionDetails(orderId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transaction_Details");
  if (!sheet || sheet.getLastRow() < 2)
    return createJsonResponse({ items: [] });
  const rows = sheet.getDataRange().getValues();
  const targetId = String(orderId).trim();
  const items = rows
    .slice(1)
    .filter((row) => String(row[0]).trim() === targetId)
    .map((row) => ({
      name: row[3],
      qty: Number(row[4]),
      price: Number(row[5]),
      allocation: row[8],
    }));
  return createJsonResponse({ items });
}

/**
 * Get categories from the Categories sheet
 * Sheet structure: A = name, B = icon (optional)
 */
function getCategories() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Categories");
  const defaultCategories = [
    { name: "Food" },
    { name: "Drinks" },
    { name: "Snack" },
  ];

  if (!sheet || sheet.getLastRow() < 2) {
    return createJsonResponse({ categories: defaultCategories });
  }

  const rows = sheet.getDataRange().getValues();
  const categories = rows
    .slice(1)
    .map((row) => ({
      name: String(row[0]),
      icon: row[1] || "",
    }))
    .filter((cat) => cat.name && cat.name.trim() !== "");

  return createJsonResponse({
    categories: categories.length > 0 ? categories : defaultCategories,
  });
}

/**
 * Upload base64 image to Google Drive
 * Returns the file URL on success
 */
function uploadImageToDrive(base64Data, filename) {
  try {
    // Validate input
    if (!base64Data || !filename) {
      return {
        success: false,
        message: "Data gambar atau nama file tidak tersedia",
      };
    }

    // Extract the base64 content (remove data:image/...;base64, prefix if exists)
    let base64Content = base64Data;
    let mimeType = "image/png";

    if (base64Data.includes(",")) {
      const parts = base64Data.split(",");
      base64Content = parts[1];
      // Extract mime type from the prefix
      const mimeMatch = parts[0].match(/data:([^;]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    // Decode base64 to blob
    const decoded = Utilities.base64Decode(base64Content);
    const blob = Utilities.newBlob(decoded, mimeType, filename);

    // Get or create the folder for product images
    const folderName = "POS_ProductImages";
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);

    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
      // Make folder publicly accessible
      folder.setSharing(
        DriveApp.Access.ANYONE_WITH_LINK,
        DriveApp.Permission.VIEW
      );
    }

    // Create the file in Drive
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Get file ID and return proper URL
    const fileId = file.getId();
    const driveUrl = "https://lh3.googleusercontent.com/d/" + fileId + "=w500";

    return {
      success: true,
      url: driveUrl,
      message: "Gambar berhasil diupload ke Drive",
    };
  } catch (error) {
    return {
      success: false,
      message: "Gagal upload gambar: " + error.toString(),
    };
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
