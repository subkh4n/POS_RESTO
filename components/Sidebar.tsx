import React from "react";
import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  Settings,
  LogOut,
  FileText,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { ViewState } from "../types";
import { radius, shadows, typography } from "../styles/design-system";

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const menuItems: { icon: any; label: string; view: ViewState }[] = [
    { icon: LayoutDashboard, label: "Dash", view: "dashboard" },
    { icon: UtensilsCrossed, label: "Kasir", view: "pos" },
    { icon: FileText, label: "Histori", view: "reports" },
    { icon: Wallet, label: "Finance", view: "finance" },
    { icon: ShoppingBag, label: "Stok", view: "items" },
    { icon: Settings, label: "Opsi", view: "settings" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`w-20 lg:w-24 bg-white h-screen flex flex-col items-center py-6 ${shadows.xl} z-20 hidden md:flex flex-none border-r border-gray-100`}
      >
        <div
          className={`mb-10 p-3 bg-slate-900 ${radius.lg} text-white ${shadows.lg}`}
        >
          <Store size={24} />
        </div>

        <div className="flex-1 flex flex-col gap-4 w-full px-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => onNavigate(item.view)}
              className={`w-full flex flex-col items-center justify-center py-4 ${
                radius.lg
              } transition-all duration-300 group
                ${
                  currentView === item.view
                    ? `bg-slate-900 text-white ${shadows.xl} scale-105`
                    : "text-gray-400 hover:bg-gray-50 hover:text-slate-600"
                }`}
            >
              <item.icon
                size={22}
                strokeWidth={currentView === item.view ? 2.5 : 2}
              />
              <span className={`${typography.labelSmall} mt-1.5`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <button className="mt-auto p-4 text-gray-300 hover:text-red-500 transition-colors">
          <LogOut size={22} />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-2 py-2 flex justify-around items-center z-[100] shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        {menuItems.slice(0, 5).map((item, index) => (
          <button
            key={index}
            onClick={() => onNavigate(item.view)}
            className={`flex flex-col items-center justify-center p-2 ${
              radius.md
            } transition-all
              ${
                currentView === item.view
                  ? "text-slate-900 scale-110"
                  : "text-gray-400"
              }`}
          >
            <item.icon
              size={20}
              strokeWidth={currentView === item.view ? 2.5 : 2}
            />
            <span className="text-[8px] mt-1 font-bold">{item.label}</span>
            {currentView === item.view && (
              <div className={`w-1 h-1 bg-slate-900 ${radius.full} mt-1`}></div>
            )}
          </button>
        ))}
      </div>
    </>
  );
};

export default Sidebar;
