import { GOOGLE_SCRIPT_URL } from "../constants";

// Types
export interface QrisPayload {
  id: string;
  name: string;
  payload: string;
  is_active: boolean;
  created_at: string;
}

export interface QrisTransaction {
  id: string;
  customer_name: string;
  amount: number;
  status: "pending" | "success" | "failed";
  qris_payload_id: string;
  created_at: string;
}

// MOCK DATA FOR TRANSACTIONS (Transactions still use mock for now)
let MOCK_TX: QrisTransaction[] = [];

// Database Service Interface
export const db = {
  qris: {
    /**
     * Get all QRIS payloads
     */
    list: async (): Promise<QrisPayload[]> => {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "cors", // Ensure CORS mode
          headers: { "Content-Type": "text/plain" }, // GAS often prefers text/plain to avoid preflight issues
          body: JSON.stringify({ action: "getQrisPayloads" }),
        });
        const data = await response.json();
        return data.payloads || [];
      } catch (error) {
        console.error("Failed to fetch QRIS:", error);
        return [];
      }
    },

    /**
     * Create new QRIS payload
     */
    create: async (name: string, payload: string): Promise<QrisPayload> => {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "addQrisPayload", name, payload }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message);

        return {
          id: data.id,
          name,
          payload,
          is_active: false, // Default inactive unless it's the first one
          created_at: new Date().toISOString(),
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Gagal menyimpan QRIS",
        );
      }
    },

    /**
     * Set a QRIS payload as active (deactivates others)
     */
    setActive: async (id: string): Promise<void> => {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "setActiveQris", id }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
      } catch (error) {
        throw new Error("Gagal mengaktifkan QRIS");
      }
    },

    /**
     * Get the currently active QRIS payload
     */
    getActive: async (): Promise<QrisPayload | null> => {
      try {
        const list = await db.qris.list();
        return list.find((q) => q.is_active) || null;
      } catch (error) {
        return null;
      }
    },

    /**
     * Delete a QRIS payload
     */
    delete: async (id: string): Promise<void> => {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "deleteQrisPayload", id }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
      } catch (error) {
        throw new Error("Gagal menghapus QRIS");
      }
    },
  },

  transactions: {
    /**
     * Create new transaction
     */
    create: async (data: {
      customer_name: string;
      amount: number;
      qris_payload_id: string;
    }): Promise<QrisTransaction> => {
      const newTx: QrisTransaction = {
        ...data,
        id: "TX-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        status: "pending",
        created_at: new Date().toISOString(),
      };
      MOCK_TX.push(newTx);
      return newTx;
    },

    /**
     * List all transactions
     */
    list: async (): Promise<QrisTransaction[]> => {
      return [...MOCK_TX].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    },

    /**
     * Update transaction status
     */
    updateStatus: async (
      id: string,
      status: "success" | "failed",
    ): Promise<void> => {
      MOCK_TX = MOCK_TX.map((t) => (t.id === id ? { ...t, status } : t));
    },
  },
};
