/**
 * Online Order Module - Customer Authentication & Order Management
 * For mobile ordering integration (PWA)
 *
 * Sheets Required:
 * - Customers: id, name, phone, email, password, address, created_at, last_login, is_active
 * - OnlineOrders: order_id, customer_id, customer_name, customer_phone, items_json,
 *                 subtotal, tax, total, payment_method, payment_status, order_status,
 *                 queue_number, estimated_time, notes, created_at, updated_at, completed_at
 */

// ========== SHEET CONFIGURATION ==========
const CUSTOMERS_SHEET_NAME = "Customers";
const ONLINE_ORDERS_SHEET_NAME = "OnlineOrders";
const DEFAULT_ESTIMATED_TIME = 20; // minutes

// ========== CUSTOMER AUTHENTICATION ==========

/**
 * Handle customer registration
 * @param {Object} data - {name, phone, password, email?, address?}
 */
function handleCustomerRegister(data) {
  try {
    if (!data.name || !data.phone || !data.password) {
      return createOnlineOrderResponse({
        success: false,
        message: "Nama, nomor HP, dan password wajib diisi",
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CUSTOMERS_SHEET_NAME);

    // Create sheet if not exists
    if (!sheet) {
      sheet = createCustomersSheet(ss);
    }

    // Check if phone already registered
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][2]).trim() === String(data.phone).trim()) {
        return createOnlineOrderResponse({
          success: false,
          message: "Nomor HP sudah terdaftar",
        });
      }
    }

    // Generate customer ID
    const customerId = "CUST-" + String(Date.now()).slice(-6);

    // Add new customer
    sheet.appendRow([
      customerId,
      data.name,
      String(data.phone).trim(),
      data.email || "",
      data.password, // In production, use hash!
      data.address || "",
      new Date(),
      "",
      true,
    ]);

    return createOnlineOrderResponse({
      success: true,
      message: "Registrasi berhasil",
      customer: {
        id: customerId,
        name: data.name,
        phone: data.phone,
        email: data.email || "",
      },
    });
  } catch (error) {
    return createOnlineOrderResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Handle customer login
 * @param {Object} data - {phone, password}
 */
function handleCustomerLogin(data) {
  try {
    if (!data.phone || !data.password) {
      return createOnlineOrderResponse({
        success: false,
        message: "Nomor HP dan password wajib diisi",
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return createOnlineOrderResponse({
        success: false,
        message: "Akun tidak ditemukan",
      });
    }

    const rows = sheet.getDataRange().getValues();
    const phone = String(data.phone).trim();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][2]).trim() === phone) {
        // Check if active
        if (rows[i][8] === false || rows[i][8] === "FALSE") {
          return createOnlineOrderResponse({
            success: false,
            message: "Akun tidak aktif",
          });
        }

        // Verify password
        if (rows[i][4] === data.password) {
          // Update last login
          sheet.getRange(i + 1, 8).setValue(new Date());

          return createOnlineOrderResponse({
            success: true,
            message: "Login berhasil",
            customer: {
              id: String(rows[i][0]),
              name: rows[i][1],
              phone: rows[i][2],
              email: rows[i][3] || "",
              address: rows[i][5] || "",
            },
          });
        } else {
          return createOnlineOrderResponse({
            success: false,
            message: "Password salah",
          });
        }
      }
    }

    return createOnlineOrderResponse({
      success: false,
      message: "Nomor HP tidak terdaftar",
    });
  } catch (error) {
    return createOnlineOrderResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

// ========== ONLINE ORDER MANAGEMENT ==========

/**
 * Create new online order
 * @param {Object} data - order data from customer app
 */
function handleCreateOnlineOrder(data) {
  try {
    if (!data.customerId || !data.items || data.items.length === 0) {
      return createOnlineOrderResponse({
        success: false,
        message: "Customer ID dan items wajib diisi",
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(ONLINE_ORDERS_SHEET_NAME);

    // Create sheet if not exists
    if (!sheet) {
      sheet = createOnlineOrdersSheet(ss);
    }

    // Generate order ID
    const timestamp = Date.now();
    const orderId =
      "ONL-" + String(data.customerId).slice(-4) + "-" + timestamp;

    // Calculate queue number (today's orders + 1)
    const queueNumber = getNextQueueNumber(sheet);

    // Estimated time based on items count
    const estimatedTime = Math.max(
      DEFAULT_ESTIMATED_TIME,
      data.items.length * 5
    );

    const now = new Date();

    // Add order
    sheet.appendRow([
      orderId, // A: order_id
      data.customerId, // B: customer_id
      data.customerName || "", // C: customer_name
      data.customerPhone || "", // D: customer_phone
      JSON.stringify(data.items), // E: items_json
      data.subtotal || 0, // F: subtotal
      data.tax || 0, // G: tax
      data.total || 0, // H: total
      data.paymentMethod || "COD", // I: payment_method
      "PENDING", // J: payment_status
      "PENDING", // K: order_status
      queueNumber, // L: queue_number
      estimatedTime, // M: estimated_time
      data.notes || "", // N: notes
      now, // O: created_at
      now, // P: updated_at
      "", // Q: completed_at
    ]);

    // Update product stock
    updateProductStock(data.items);

    return createOnlineOrderResponse({
      success: true,
      message: "Pesanan berhasil dibuat",
      order: {
        orderId: orderId,
        queueNumber: queueNumber,
        estimatedTime: estimatedTime,
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
        createdAt: now.toISOString(),
      },
    });
  } catch (error) {
    return createOnlineOrderResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Get customer's orders
 * @param {Object} data - {customerId}
 */
function handleGetOnlineOrders(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ONLINE_ORDERS_SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return createOnlineOrderResponse({ orders: [] });
    }

    const rows = sheet.getDataRange().getValues();
    const customerId = String(data.customerId).trim();
    const orders = [];

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).trim() === customerId) {
        orders.push({
          orderId: rows[i][0],
          items: JSON.parse(rows[i][4] || "[]"),
          subtotal: Number(rows[i][5]),
          tax: Number(rows[i][6]),
          total: Number(rows[i][7]),
          paymentMethod: rows[i][8],
          paymentStatus: rows[i][9],
          orderStatus: rows[i][10],
          queueNumber: Number(rows[i][11]),
          estimatedTime: Number(rows[i][12]),
          notes: rows[i][13],
          createdAt: rows[i][14] ? new Date(rows[i][14]).toISOString() : "",
          updatedAt: rows[i][15] ? new Date(rows[i][15]).toISOString() : "",
        });
      }
    }

    // Sort by newest first
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return createOnlineOrderResponse({ orders: orders });
  } catch (error) {
    return createOnlineOrderResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Get order tracking info
 * @param {Object} data - {orderId}
 */
function handleGetOrderTracking(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ONLINE_ORDERS_SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return createOnlineOrderResponse({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    const rows = sheet.getDataRange().getValues();
    const orderId = String(data.orderId).trim();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === orderId) {
        return createOnlineOrderResponse({
          success: true,
          order: {
            orderId: rows[i][0],
            customerName: rows[i][2],
            orderStatus: rows[i][10],
            paymentStatus: rows[i][9],
            queueNumber: Number(rows[i][11]),
            estimatedTime: Number(rows[i][12]),
            total: Number(rows[i][7]),
            paymentMethod: rows[i][8],
            createdAt: rows[i][14] ? new Date(rows[i][14]).toISOString() : "",
            updatedAt: rows[i][15] ? new Date(rows[i][15]).toISOString() : "",
            completedAt: rows[i][16] ? new Date(rows[i][16]).toISOString() : "",
          },
        });
      }
    }

    return createOnlineOrderResponse({
      success: false,
      message: "Pesanan tidak ditemukan",
    });
  } catch (error) {
    return createOnlineOrderResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Update order status (for Kasir/Admin)
 * @param {Object} data - {orderId, orderStatus?, paymentStatus?, estimatedTime?}
 */
function handleUpdateOrderStatus(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ONLINE_ORDERS_SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return createOnlineOrderResponse({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    const rows = sheet.getDataRange().getValues();
    const orderId = String(data.orderId).trim();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === orderId) {
        // Update payment status
        if (data.paymentStatus) {
          sheet.getRange(i + 1, 10).setValue(data.paymentStatus);
        }

        // Update order status
        if (data.orderStatus) {
          sheet.getRange(i + 1, 11).setValue(data.orderStatus);

          // If completed, set completed_at
          if (data.orderStatus === "COMPLETED") {
            sheet.getRange(i + 1, 17).setValue(new Date());
          }
        }

        // Update estimated time
        if (data.estimatedTime !== undefined) {
          sheet.getRange(i + 1, 13).setValue(data.estimatedTime);
        }

        // Update updated_at
        sheet.getRange(i + 1, 16).setValue(new Date());

        return createOnlineOrderResponse({
          success: true,
          message: "Status pesanan diperbarui",
        });
      }
    }

    return createOnlineOrderResponse({
      success: false,
      message: "Pesanan tidak ditemukan",
    });
  } catch (error) {
    return createOnlineOrderResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Get pending online orders (for Kasir dashboard)
 */
function handleGetPendingOnlineOrders() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ONLINE_ORDERS_SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return createOnlineOrderResponse({ orders: [] });
    }

    const rows = sheet.getDataRange().getValues();
    const orders = [];
    const activeStatuses = ["PENDING", "CONFIRMED", "COOKING", "READY"];

    for (let i = 1; i < rows.length; i++) {
      const status = rows[i][10];
      if (activeStatuses.includes(status)) {
        orders.push({
          orderId: rows[i][0],
          customerId: rows[i][1],
          customerName: rows[i][2],
          customerPhone: rows[i][3],
          items: JSON.parse(rows[i][4] || "[]"),
          subtotal: Number(rows[i][5]),
          tax: Number(rows[i][6]),
          total: Number(rows[i][7]),
          paymentMethod: rows[i][8],
          paymentStatus: rows[i][9],
          orderStatus: status,
          queueNumber: Number(rows[i][11]),
          estimatedTime: Number(rows[i][12]),
          notes: rows[i][13],
          createdAt: rows[i][14] ? new Date(rows[i][14]).toISOString() : "",
        });
      }
    }

    // Sort by queue number
    orders.sort((a, b) => a.queueNumber - b.queueNumber);

    return createOnlineOrderResponse({ orders: orders });
  } catch (error) {
    return createOnlineOrderResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

// ========== HELPER FUNCTIONS ==========

/**
 * Create Customers sheet with headers
 */
function createCustomersSheet(ss) {
  const sheet = ss.insertSheet(CUSTOMERS_SHEET_NAME);
  sheet.appendRow([
    "id",
    "name",
    "phone",
    "email",
    "password",
    "address",
    "created_at",
    "last_login",
    "is_active",
  ]);
  return sheet;
}

/**
 * Create OnlineOrders sheet with headers
 */
function createOnlineOrdersSheet(ss) {
  const sheet = ss.insertSheet(ONLINE_ORDERS_SHEET_NAME);
  sheet.appendRow([
    "order_id",
    "customer_id",
    "customer_name",
    "customer_phone",
    "items_json",
    "subtotal",
    "tax",
    "total",
    "payment_method",
    "payment_status",
    "order_status",
    "queue_number",
    "estimated_time",
    "notes",
    "created_at",
    "updated_at",
    "completed_at",
  ]);
  return sheet;
}

/**
 * Get next queue number for today
 */
function getNextQueueNumber(sheet) {
  if (sheet.getLastRow() < 2) return 1;

  const rows = sheet.getDataRange().getValues();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let maxQueue = 0;
  for (let i = 1; i < rows.length; i++) {
    const orderDate = new Date(rows[i][14]);
    orderDate.setHours(0, 0, 0, 0);

    if (orderDate.getTime() === today.getTime()) {
      const queueNum = Number(rows[i][11]) || 0;
      if (queueNum > maxQueue) maxQueue = queueNum;
    }
  }

  return maxQueue + 1;
}

/**
 * Create JSON response
 */
function createOnlineOrderResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// ========== CUSTOMER MANAGEMENT (Admin) ==========

/**
 * Get all customers (for Admin dashboard)
 */
function handleGetCustomers() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return createOnlineOrderResponse({ customers: [] });
    }

    const rows = sheet.getDataRange().getValues();
    const customers = [];

    for (let i = 1; i < rows.length; i++) {
      customers.push({
        id: String(rows[i][0]),
        name: rows[i][1],
        phone: String(rows[i][2]),
        email: rows[i][3] || "",
        address: rows[i][5] || "",
        createdAt: rows[i][6] ? new Date(rows[i][6]).toISOString() : "",
        lastLogin: rows[i][7] ? new Date(rows[i][7]).toISOString() : "",
        isActive:
          rows[i][8] === true || rows[i][8] === "TRUE" || rows[i][8] === "true",
      });
    }

    // Sort by newest first
    customers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return createOnlineOrderResponse({ customers: customers });
  } catch (error) {
    return createOnlineOrderResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Update customer data (for Admin)
 * @param {Object} data - {id, name?, phone?, email?, address?}
 */
function handleUpdateCustomer(data) {
  try {
    if (!data.id) {
      return createOnlineOrderResponse({
        success: false,
        message: "Customer ID wajib diisi",
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return createOnlineOrderResponse({
        success: false,
        message: "Customer tidak ditemukan",
      });
    }

    const rows = sheet.getDataRange().getValues();
    const customerId = String(data.id).trim();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === customerId) {
        // Update fields if provided
        if (data.name !== undefined)
          sheet.getRange(i + 1, 2).setValue(data.name);
        if (data.phone !== undefined)
          sheet.getRange(i + 1, 3).setValue(String(data.phone));
        if (data.email !== undefined)
          sheet.getRange(i + 1, 4).setValue(data.email);
        if (data.address !== undefined)
          sheet.getRange(i + 1, 6).setValue(data.address);

        return createOnlineOrderResponse({
          success: true,
          message: "Data customer berhasil diperbarui",
        });
      }
    }

    return createOnlineOrderResponse({
      success: false,
      message: "Customer tidak ditemukan",
    });
  } catch (error) {
    return createOnlineOrderResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Delete customer (for Admin)
 * @param {Object} data - {id}
 */
function handleDeleteCustomer(data) {
  try {
    if (!data.id) {
      return createOnlineOrderResponse({
        success: false,
        message: "Customer ID wajib diisi",
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return createOnlineOrderResponse({
        success: false,
        message: "Customer tidak ditemukan",
      });
    }

    const rows = sheet.getDataRange().getValues();
    const customerId = String(data.id).trim();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === customerId) {
        sheet.deleteRow(i + 1);
        return createOnlineOrderResponse({
          success: true,
          message: "Customer berhasil dihapus",
        });
      }
    }

    return createOnlineOrderResponse({
      success: false,
      message: "Customer tidak ditemukan",
    });
  } catch (error) {
    return createOnlineOrderResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Toggle customer active status (for Admin)
 * @param {Object} data - {id, isActive}
 */
function handleToggleCustomerActive(data) {
  try {
    if (!data.id || data.isActive === undefined) {
      return createOnlineOrderResponse({
        success: false,
        message: "Customer ID dan status wajib diisi",
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return createOnlineOrderResponse({
        success: false,
        message: "Customer tidak ditemukan",
      });
    }

    const rows = sheet.getDataRange().getValues();
    const customerId = String(data.id).trim();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === customerId) {
        sheet.getRange(i + 1, 9).setValue(data.isActive);
        return createOnlineOrderResponse({
          success: true,
          message: data.isActive
            ? "Customer diaktifkan"
            : "Customer dinonaktifkan",
        });
      }
    }

    return createOnlineOrderResponse({
      success: false,
      message: "Customer tidak ditemukan",
    });
  } catch (error) {
    return createOnlineOrderResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}

/**
 * Reset customer password (for Admin)
 * @param {Object} data - {id, newPassword}
 */
function handleResetCustomerPassword(data) {
  try {
    if (!data.id || !data.newPassword) {
      return createOnlineOrderResponse({
        success: false,
        message: "Customer ID dan password baru wajib diisi",
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return createOnlineOrderResponse({
        success: false,
        message: "Customer tidak ditemukan",
      });
    }

    const rows = sheet.getDataRange().getValues();
    const customerId = String(data.id).trim();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === customerId) {
        sheet.getRange(i + 1, 5).setValue(data.newPassword);
        return createOnlineOrderResponse({
          success: true,
          message: "Password customer berhasil direset",
        });
      }
    }

    return createOnlineOrderResponse({
      success: false,
      message: "Customer tidak ditemukan",
    });
  } catch (error) {
    return createOnlineOrderResponse({
      success: false,
      message: "Error: " + error.toString(),
    });
  }
}
