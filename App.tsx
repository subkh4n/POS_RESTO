import React, { useState, useEffect } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Sidebar from "./components/Sidebar";
import ReportsPage from "./components/ReportsPage";
import ItemsPage from "./components/ItemsPage";
import FinancePage from "./components/FinancePage";
import DashboardView from "./views/DashboardView";
import POSView from "./views/POSView";
import { useAppData } from "./hooks/useAppData";
import { useCart } from "./hooks/useCart";
import { ViewState } from "./types";
import { Settings } from "lucide-react";

function App() {
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [orderType, setOrderType] = useState<string>("Dine In");

  // Menggunakan Hooks yang dipisahkan
  const { products, categories, transactions, isLoading, fetchData } =
    useAppData();
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

  const renderView = () => {
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
          setCurrentView(v);
          fetchData();
        }}
      />
      {renderView()}
      <SpeedInsights />
    </div>
  );
}

export default App;
