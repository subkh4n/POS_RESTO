import React, { useState } from "react";
import {
  Store,
  LayoutDashboard,
  Settings,
  LogOut,
  FileText,
  UtensilsCrossed,
  Wallet,
  Users,
  ChevronRight,
  Database,
  Package,
  ClipboardList,
  ShoppingCart,
  Receipt,
  DollarSign,
  PieChart,
  User,
  UserCheck,
} from "lucide-react";
import { ViewState } from "../types";
import { useStore } from "../contexts/StoreContext";
import { useAuth } from "../modules/user";

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  userRole?: "ADMIN" | "MANAGER" | "KASIR";
  onLogout?: () => void;
}

interface MenuItem {
  icon: any;
  label: string;
  view?: ViewState;
  roles: string[];
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  userRole = "KASIR",
  onLogout,
}) => {
  const { settings } = useStore();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Menu structure dengan grouping
  const menuGroups: MenuItem[] = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      view: "dashboard",
      roles: ["ADMIN", "MANAGER", "KASIR"],
    },
    {
      icon: Database,
      label: "Master Data",
      roles: ["ADMIN", "MANAGER"],
      children: [
        {
          icon: Package,
          label: "Produk & Stok",
          view: "items",
          roles: ["ADMIN", "MANAGER"],
        },
        {
          icon: Users,
          label: "Pengguna",
          view: "users",
          roles: ["ADMIN"],
        },
        {
          icon: UserCheck,
          label: "Pelanggan",
          view: "customers",
          roles: ["ADMIN"],
        },
      ],
    },
    {
      icon: UtensilsCrossed,
      label: "POS",
      view: "pos",
      roles: ["ADMIN", "MANAGER", "KASIR"],
    },
    {
      icon: ClipboardList,
      label: "Operasional",
      roles: ["ADMIN", "MANAGER", "KASIR"],
      children: [
        {
          icon: ShoppingCart,
          label: "Orderan Online",
          view: "onlineOrders",
          roles: ["ADMIN", "MANAGER", "KASIR"],
        },
      ],
    },
    {
      icon: DollarSign,
      label: "Keuangan",
      roles: ["ADMIN", "MANAGER"],
      children: [
        {
          icon: Wallet,
          label: "Kas & Keuangan",
          view: "finance",
          roles: ["ADMIN", "MANAGER"],
        },
      ],
    },
    {
      icon: PieChart,
      label: "Laporan",
      view: "reports",
      roles: ["ADMIN", "MANAGER"],
    },
  ];

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const isMenuExpanded = (label: string) => expandedMenus.includes(label);

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.view === currentView) return true;
    if (item.children) {
      return item.children.some((child) => child.view === currentView);
    }
    return false;
  };

  const canAccessMenu = (item: MenuItem): boolean => {
    if (item.roles.includes(userRole)) {
      if (item.children) {
        return item.children.some((child) => child.roles.includes(userRole));
      }
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    if (onLogout && confirm("Apakah Anda yakin ingin keluar?")) {
      onLogout();
    }
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    if (!canAccessMenu(item)) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = isMenuExpanded(item.label);
    const isActive = isMenuActive(item);

    return (
      <div key={item.label} className={isChild ? "" : "mb-1"}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleMenu(item.label);
            } else if (item.view) {
              onNavigate(item.view);
            }
          }}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
            ${isChild ? "pl-10 py-2.5" : ""}
            ${
              isActive
                ? isChild
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "bg-cyan-500/10 text-cyan-400"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
        >
          <div className="flex items-center gap-3">
            <item.icon size={isChild ? 16 : 18} strokeWidth={2} />
            <span
              className={`text-sm ${
                isActive ? "font-semibold" : "font-medium"
              }`}
            >
              {item.label}
            </span>
          </div>
          {hasChildren && (
            <ChevronRight
              size={16}
              className={`transition-transform duration-200 ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          )}
        </button>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children
              ?.filter((child) => child.roles.includes(userRole))
              .map((child) => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="w-64 bg-slate-900 h-screen flex-col hidden md:flex flex-none">
        {/* Logo Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <div className="p-2 bg-cyan-500 rounded-lg">
            <Store size={24} className="text-white" />
          </div>
          <span className="text-lg font-bold text-cyan-400 tracking-wide">
            {settings.storeName || "FOODCOURT"}
          </span>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {menuGroups.map((item) => renderMenuItem(item))}
        </div>

        {/* Settings Section */}
        <div className="border-t border-slate-800">
          <div className="p-3">
            <button
              onClick={() => onNavigate("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${
                  currentView === "settings"
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
            >
              <Settings size={18} />
              <span className="text-sm font-medium">Pengaturan</span>
            </button>
          </div>

          {/* User Profile */}
          <div className="p-3 pt-0">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-lg">
              <div className="w-9 h-9 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <User size={18} className="text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-500">{user?.role || "Role"}</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="p-3 pt-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2 flex justify-around items-center z-[100]">
        {[
          {
            icon: LayoutDashboard,
            label: "Home",
            view: "dashboard" as ViewState,
          },
          { icon: UtensilsCrossed, label: "POS", view: "pos" as ViewState },
          { icon: Receipt, label: "Histori", view: "reports" as ViewState },
          { icon: Package, label: "Stok", view: "items" as ViewState },
          { icon: Settings, label: "Menu", view: "settings" as ViewState },
        ].map((item, index) => (
          <button
            key={index}
            onClick={() => onNavigate(item.view)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all
              ${
                currentView === item.view ? "text-cyan-400" : "text-slate-500"
              }`}
          >
            <item.icon
              size={20}
              strokeWidth={currentView === item.view ? 2.5 : 2}
            />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            {currentView === item.view && (
              <div className="w-1 h-1 bg-cyan-400 rounded-full mt-1"></div>
            )}
          </button>
        ))}
      </div>
    </>
  );
};

export default Sidebar;
