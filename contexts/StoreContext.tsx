// Store Settings Context - Global store name, address, phone

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { GOOGLE_SCRIPT_URL } from "../constants";

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeTagline: string;
}

interface StoreContextType {
  settings: StoreSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "FoodCourt POS",
  storeAddress: "",
  storePhone: "",
  storeTagline: "Sistem Kasir Modern",
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getStoreSettings" }),
      });
      const data = await response.json();
      if (data.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
    } catch (err) {
      console.error("Failed to fetch store settings:", err);
      setError("Gagal memuat pengaturan toko");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (
    newSettings: Partial<StoreSettings>
  ): Promise<boolean> => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "updateStoreSettings",
          ...newSettings,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setSettings((prev) => ({ ...prev, ...newSettings }));
        return true;
      } else {
        setError(data.message || "Gagal menyimpan pengaturan");
        return false;
      }
    } catch (err) {
      setError("Gagal menyimpan pengaturan toko");
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <StoreContext.Provider
      value={{
        settings,
        isLoading,
        error,
        updateSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
};

export default StoreContext;
