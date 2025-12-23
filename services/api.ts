import { GOOGLE_SCRIPT_URL, MOCK_PRODUCTS } from "../constants";
import { OrderPayload, Product, TransactionRecord } from "../types";

// Utility for fetching with timeout
const fetchWithTimeout = async (
  url: string,
  options: any = {},
  timeout = 20000
) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const getProducts = async (): Promise<Product[]> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_URL"))
    return MOCK_PRODUCTS;
  try {
    const response = await fetchWithTimeout(
      `${GOOGLE_SCRIPT_URL}?action=getProducts`
    );
    const data = await response.json();
    return data.items && data.items.length > 0 ? data.items : MOCK_PRODUCTS;
  } catch (error) {
    console.warn("API Error, using mock:", error);
    return MOCK_PRODUCTS;
  }
};

export const getCategories = async (): Promise<
  { name: string; icon?: string }[]
> => {
  const def = [{ name: "Food" }, { name: "Drinks" }, { name: "Snack" }];
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_URL")) return def;
  try {
    const response = await fetchWithTimeout(
      `${GOOGLE_SCRIPT_URL}?action=getCategories`
    );
    const data = await response.json();
    return data.categories || def;
  } catch (error) {
    return def;
  }
};

export const getModifiers = async (): Promise<{
  groups: import("../types").ModifierGroup[];
  items: import("../types").ModifierItem[];
}> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_URL")) {
    return { groups: [], items: [] };
  }
  try {
    const response = await fetchWithTimeout(
      `${GOOGLE_SCRIPT_URL}?action=getModifiers`
    );
    const data = await response.json();
    return { groups: data.groups || [], items: data.items || [] };
  } catch (error) {
    console.warn("Failed to fetch modifiers:", error);
    return { groups: [], items: [] };
  }
};

export const getTransactions = async (): Promise<TransactionRecord[]> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_URL")) return [];
  try {
    const response = await fetchWithTimeout(
      `${GOOGLE_SCRIPT_URL}?action=getTransactions`
    );
    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    console.error("Fetch Transactions Error:", error);
    return [];
  }
};

export const getTransactionDetails = async (id: string): Promise<any[]> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_URL")) return [];
  try {
    const response = await fetchWithTimeout(
      `${GOOGLE_SCRIPT_URL}?action=getTransactionDetails&id=${id}`
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    return [];
  }
};

/**
 * NOTE FOR GOOGLE APPS SCRIPT POST:
 * Avoid custom headers like 'Content-Type': 'application/json' to prevent OPTIONS preflight.
 * Apps Script doPost handles stringified JSON in e.postData.contents perfectly.
 */
const postToScript = async (payload: any) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      redirect: "follow",
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Post Error:", error);
    throw error;
  }
};

export const deleteTransaction = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  if (!GOOGLE_SCRIPT_URL)
    return { success: false, message: "URL API belum diset" };
  try {
    return await postToScript({ action: "deleteTransaction", id: String(id) });
  } catch (error) {
    return { success: false, message: "Gagal menghubungi server Google." };
  }
};

export const updateTransaction = async (data: {
  id: string;
  tableNumber: string;
  orderType: string;
  paymentMethod: string;
}): Promise<{ success: boolean; message: string }> => {
  if (!GOOGLE_SCRIPT_URL)
    return { success: false, message: "URL API belum diset" };
  try {
    return await postToScript({
      action: "updateTransaction",
      id: String(data.id),
      tableNumber: data.tableNumber,
      orderType: data.orderType,
      paymentMethod: data.paymentMethod,
    });
  } catch (error) {
    return { success: false, message: "Gagal memperbarui data di Sheets." };
  }
};

export const submitOrder = async (
  order: OrderPayload
): Promise<{ success: boolean; message: string; orderId?: string }> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_URL")) {
    await new Promise((r) => setTimeout(r, 500));
    return {
      success: true,
      message: "Simulasi berhasil!",
      orderId: order.orderId,
    };
  }
  try {
    return await postToScript({ action: "addOrder", ...order });
  } catch (error) {
    return { success: false, message: "Gagal simpan order." };
  }
};

export const uploadImage = async (
  base64: string,
  filename: string
): Promise<{ success: boolean; url?: string; message: string }> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_URL")) {
    return {
      success: true,
      url: base64,
      message: "Simulasi: Menggunakan base64 lokal",
    };
  }
  try {
    return await postToScript({ action: "uploadImage", base64, filename });
  } catch (error) {
    return { success: false, message: "Gagal upload gambar." };
  }
};

export const addProduct = async (
  product: Partial<Product>
): Promise<{ success: boolean; message: string }> => {
  if (!GOOGLE_SCRIPT_URL)
    return { success: false, message: "URL API belum diset" };
  try {
    return await postToScript({ action: "addProduct", ...product });
  } catch (error) {
    return { success: false, message: "Gagal tambah produk." };
  }
};

export const updateProduct = async (
  product: Partial<Product>
): Promise<{ success: boolean; message: string }> => {
  if (!GOOGLE_SCRIPT_URL)
    return { success: false, message: "URL API belum diset" };
  try {
    return await postToScript({ action: "updateProduct", ...product });
  } catch (error) {
    return { success: false, message: "Gagal update produk." };
  }
};

export const deleteProduct = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  if (!GOOGLE_SCRIPT_URL)
    return { success: false, message: "URL API belum diset" };
  try {
    return await postToScript({ action: "deleteProduct", id: String(id) });
  } catch (error) {
    return { success: false, message: "Gagal hapus produk." };
  }
};

export const adjustStock = async (
  productId: string,
  quantity: number,
  actionType: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT",
  notes: string
): Promise<{ success: boolean; newStock?: number; message: string }> => {
  if (!GOOGLE_SCRIPT_URL)
    return { success: false, message: "URL API belum diset" };
  try {
    return await postToScript({
      action: "adjustStock",
      productId: String(productId),
      quantity,
      actionType,
      notes,
    });
  } catch (error) {
    return { success: false, message: "Gagal menyesuaikan stok." };
  }
};
