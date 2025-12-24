/**
 * QRIS Module - Midtrans Integration
 * File terpisah untuk handling pembayaran QRIS via Midtrans
 */

// ========== MIDTRANS CONFIGURATION ==========
// IMPORTANT: Replace with your actual Midtrans Server Key
const MIDTRANS_SERVER_KEY = "YOUR_MIDTRANS_SERVER_KEY"; // Get from Midtrans Dashboard > Settings > Access Keys
const MIDTRANS_IS_PRODUCTION = false; // Set to true for production
const MIDTRANS_API_URL = MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

// ========== QRIS TRANSACTION FUNCTIONS ==========

/**
 * Create Midtrans QRIS transaction and return Snap token
 * @param {Object} orderData - Order data with amount, orderId, customerName
 * @returns {Object} Response with token for Snap popup
 */
function createMidtransQrisTransaction(orderData) {
  try {
    const authHeader =
      "Basic " + Utilities.base64Encode(MIDTRANS_SERVER_KEY + ":");

    // Generate unique order ID if not provided
    const orderId =
      orderData.orderId || "QRIS-" + Math.floor(Math.random() * 1000000);

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: orderData.amount,
      },
      enabled_payments: ["qris"], // Lock to QRIS only
      customer_details: {
        first_name: orderData.customerName || "Customer",
      },
      expiry: {
        unit: "minutes",
        duration: 15,
      },
    };

    const options = {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: authHeader },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(MIDTRANS_API_URL, options);
    const result = JSON.parse(response.getContentText());

    // Check if Midtrans returned an error
    if (result.error_messages) {
      return createQrisJsonResponse({
        success: false,
        message: result.error_messages.join(", "),
      });
    }

    // Log QRIS transaction to sheet for tracking
    logQrisTransaction(orderId, orderData.amount, result.token);

    return createQrisJsonResponse({
      success: true,
      token: result.token,
      redirect_url: result.redirect_url,
      orderId: orderId,
    });
  } catch (error) {
    return createQrisJsonResponse({
      success: false,
      message: "Gagal membuat transaksi QRIS: " + error.toString(),
    });
  }
}

/**
 * Log QRIS transaction to Google Sheets
 */
function logQrisTransaction(orderId, amount, token) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let qrisSheet = ss.getSheetByName("QRIS_Transactions");
  if (!qrisSheet) {
    qrisSheet = ss.insertSheet("QRIS_Transactions");
    qrisSheet.appendRow([
      "Order ID",
      "Amount",
      "Token",
      "Status",
      "Created At",
      "Paid At",
    ]);
  }
  qrisSheet.appendRow([orderId, amount, token, "PENDING", new Date(), ""]);
}

/**
 * Handle Midtrans webhook notification
 * Updates QRIS transaction status in Google Sheets
 * @param {Object} notif - Midtrans notification payload
 */
function handleMidtransNotification(notif) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const qrisSheet = ss.getSheetByName("QRIS_Transactions");

    if (!qrisSheet || qrisSheet.getLastRow() < 2) {
      return ContentService.createTextOutput("OK");
    }

    const data = qrisSheet.getDataRange().getValues();
    const orderId = notif.order_id;
    const transactionStatus = notif.transaction_status;

    // Map Midtrans status to our status
    let status = "PENDING";
    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      status = "LUNAS";
    } else if (
      transactionStatus === "deny" ||
      transactionStatus === "cancel" ||
      transactionStatus === "failure"
    ) {
      status = "GAGAL";
    } else if (transactionStatus === "expire") {
      status = "EXPIRED";
    }

    // Update status in sheet
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === orderId) {
        qrisSheet.getRange(i + 1, 4).setValue(status);
        if (status === "LUNAS") {
          qrisSheet.getRange(i + 1, 6).setValue(new Date());
        }
        break;
      }
    }

    return ContentService.createTextOutput("OK");
  } catch (error) {
    console.log("Error handling Midtrans notification: " + error.toString());
    return ContentService.createTextOutput("ERROR");
  }
}

/**
 * Check QRIS payment status
 * @param {String} orderId - Order ID to check
 * @returns {Object} Payment status
 */
function checkQrisPaymentStatus(orderId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const qrisSheet = ss.getSheetByName("QRIS_Transactions");

  if (!qrisSheet || qrisSheet.getLastRow() < 2) {
    return createQrisJsonResponse({
      success: false,
      message: "Transaksi tidak ditemukan",
    });
  }

  const data = qrisSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      return createQrisJsonResponse({
        success: true,
        orderId: data[i][0],
        amount: data[i][1],
        status: data[i][3],
        createdAt: data[i][4],
        paidAt: data[i][5],
      });
    }
  }

  return createQrisJsonResponse({
    success: false,
    message: "Transaksi tidak ditemukan",
  });
}

/**
 * Get all QRIS transactions
 * @returns {Object} List of QRIS transactions
 */
function getQrisTransactions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const qrisSheet = ss.getSheetByName("QRIS_Transactions");

  if (!qrisSheet || qrisSheet.getLastRow() < 2) {
    return createQrisJsonResponse({ transactions: [] });
  }

  const rows = qrisSheet.getDataRange().getValues();
  return createQrisJsonResponse({
    transactions: rows
      .slice(1)
      .map((row) => ({
        orderId: row[0],
        amount: Number(row[1]),
        status: row[3],
        createdAt: row[4],
        paidAt: row[5],
      }))
      .reverse(),
  });
}

/**
 * Helper function to create JSON response
 */
function createQrisJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
