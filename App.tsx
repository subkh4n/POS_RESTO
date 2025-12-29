import React, { useState, useEffect } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Sidebar from "./components/Sidebar";
import ReportsPage from "./components/ReportsPage";
import ItemsPage from "./components/ItemsPage";
import FinancePage from "./components/FinancePage";
import UsersPage from "./components/UsersPage";
import OnlineOrdersPage from "./components/OnlineOrdersPage";
import CustomersPage from "./components/CustomersPage";
import SettingsPage from "./components/SettingsPage";
import DashboardView from "./views/DashboardView";
import POSView from "./views/POSView";
import { useAppData } from "./hooks/useAppData";
import { useCart } from "./hooks/useCart";
import { ViewState } from "./types";
import { Loader2 } from "lucide-react";
import { GOOGLE_SCRIPT_URL } from "./constants";

// Import Auth Module
import { AuthProvider, useAuth, LoginForm } from "./modules/user";

// Default permissions (fallback)
const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  ADMIN: {
    dashboard: true,
    pos: true,
    reports: true,
    finance: true,
    items: true,
    users: true,
    settings: true,
  },
  MANAGER: {
    dashboard: true,
    pos: true,
    reports: true,
    finance: true,
    items: true,
    users: false,
    settings: false,
  },
  KASIR: {
    dashboard: true,
    pos: true,
    reports: false,
    finance: false,
    items: false,
    users: false,
    settings: false,
  },
};

// Main App Content (after login)
function MainApp() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [orderType, setOrderType] = useState<string>("Dine In");
  const [permissions, setPermissions] =
    useState<Record<string, Record<string, boolean>>>(DEFAULT_PERMISSIONS);

  // Menggunakan Hooks yang dipisahkan
  const {
    products,
    categories,
    transactions,
    modifierGroups,
    isLoading,
    fetchData,
  } = useAppData();
  const { cart, addToCart, updateQty, updatePrice, removeItem, clearCart } =
    useCart(products, orderType);

  // Fetch permissions from API
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({ action: "getPermissions" }),
        });
        const data = await response.json();
        if (data.permissions) {
          setPermissions(data.permissions);
        }
      } catch (err) {
        console.error("Failed to fetch permissions:", err);
      }
    };
    fetchPermissions();
  }, []);

  // Listener untuk event kustom donasi
  useEffect(() => {
    const handleFlexibleAdd = (e: any) => {
      addToCart(e.detail.product, e.detail.price);
    };
    window.addEventListener("add-to-cart-flexible", handleFlexibleAdd);
    return () =>
      window.removeEventListener("add-to-cart-flexible", handleFlexibleAdd);
  }, [addToCart]);

  // Check access berdasarkan role - now using dynamic permissions
  const checkAccess = (view: ViewState): boolean => {
    const role = user?.role || "";
    // ADMIN always has full access
    if (role === "ADMIN") return true;
    // For other roles, check permissions from API
    return permissions[role]?.[view] ?? false;
  };

  // Redirect ke view yang diizinkan jika tidak punya akses
  useEffect(() => {
    if (user && !checkAccess(currentView)) {
      // Jika kasir, redirect ke POS
      if (user.role === "KASIR") {
        setCurrentView("pos");
      } else {
        setCurrentView("dashboard");
      }
    }
  }, [currentView, user, permissions]);

  const renderView = () => {
    // Check access
    if (!checkAccess(currentView)) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-400 bg-white">
          <p>Anda tidak memiliki akses ke halaman ini</p>
        </div>
      );
    }

    switch (currentView) {
      case "dashboard":
        return (
          <DashboardView
            transactions={transactions}
            onNavigate={setCurrentView}
          />
        );
      case "pos":
        return (
          <POSView
            products={products}
            categories={categories}
            modifierGroups={modifierGroups}
            isLoading={isLoading}
            cart={cart}
            orderType={orderType}
            setOrderType={setOrderType}
            addToCart={addToCart}
            updateQty={updateQty}
            updatePrice={updatePrice}
            removeItem={removeItem}
            clearCart={clearCart}
            onRefresh={fetchData}
          />
        );
      case "reports":
        return <ReportsPage onRefresh={fetchData} />;
      case "finance":
        return <FinancePage />;
      case "items":
        return (
          <ItemsPage
            products={products}
            categories={categories.slice(1)}
            onRefresh={fetchData}
          />
        );
      case "users":
        return <UsersPage currentUserId={user?.id} />;
      case "customers":
        return <CustomersPage />;
      case "onlineOrders":
        return <OnlineOrdersPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return (
          <DashboardView
            transactions={transactions}
            onNavigate={setCurrentView}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 font-sans overflow-hidden">
      <Sidebar
        currentView={currentView}
        onNavigate={(v) => {
          if (checkAccess(v)) {
            setCurrentView(v);
            fetchData();
          }
        }}
        userRole={user?.role as "ADMIN" | "MANAGER" | "KASIR"}
        onLogout={logout}
      />
      {renderView()}
      <SpeedInsights />
    </div>
  );
}

// App Wrapper with Auth
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={48}
            className="animate-spin text-emerald-500 mx-auto mb-4"
          />
          <p className="text-slate-400">Memuat...</p>
        </div>
      </div>
    );
  }

  // Jika belum login, tampilkan form login
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Jika sudah login, tampilkan aplikasi
  return <MainApp />;
}

// Import StoreProvider
import { StoreProvider } from "./contexts/StoreContext";

// Root App with AuthProvider and StoreProvider
function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
