import React, { useState, useEffect } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Sidebar from "./components/Sidebar";
import ReportsPage from "./components/ReportsPage";
import ItemsPage from "./components/ItemsPage";
import FinancePage from "./components/FinancePage";
import UsersPage from "./components/UsersPage";
import DashboardView from "./views/DashboardView";
import POSView from "./views/POSView";
import { useAppData } from "./hooks/useAppData";
import { useCart } from "./hooks/useCart";
import { ViewState } from "./types";
import { Settings, Loader2 } from "lucide-react";

// Import Auth Module
import { AuthProvider, useAuth, LoginForm } from "./modules/user";

// Main App Content (after login)
function MainApp() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [orderType, setOrderType] = useState<string>("Dine In");

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

  // Listener untuk event kustom donasi
  useEffect(() => {
    const handleFlexibleAdd = (e: any) => {
      addToCart(e.detail.product, e.detail.price);
    };
    window.addEventListener("add-to-cart-flexible", handleFlexibleAdd);
    return () =>
      window.removeEventListener("add-to-cart-flexible", handleFlexibleAdd);
  }, [addToCart]);

  // Check access berdasarkan role
  const checkAccess = (view: ViewState): boolean => {
    const accessMap: Record<ViewState, string[]> = {
      dashboard: ["ADMIN", "MANAGER", "KASIR"],
      pos: ["ADMIN", "MANAGER", "KASIR"],
      reports: ["ADMIN", "MANAGER"],
      finance: ["ADMIN", "MANAGER"],
      items: ["ADMIN", "MANAGER"],
      users: ["ADMIN"],
      settings: ["ADMIN"],
    };
    return accessMap[view]?.includes(user?.role || "") ?? false;
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
  }, [currentView, user]);

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
      case "settings":
        return (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-white">
            <Settings size={64} className="opacity-20" />
          </div>
        );
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

// Root App with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
