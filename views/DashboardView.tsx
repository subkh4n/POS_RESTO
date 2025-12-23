import React, { useMemo } from "react";
import {
  TrendingUp,
  BarChart3,
  ShoppingBag,
  Target,
  Package,
  CheckCircle2,
  ChevronRight,
  WalletCards,
} from "lucide-react";
import { TransactionRecord, ViewState } from "../types";
import { fmtCurrency } from "../utils/format";
import {
  radius,
  shadows,
  typography,
  cardStyles,
  buttonStyles,
  pageStyles,
} from "../styles/design-system";

interface DashboardViewProps {
  transactions: TransactionRecord[];
  onNavigate: (view: ViewState) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  onNavigate,
}) => {
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(
      (t) => new Date(t.timestamp).toDateString() === today
    );
    const revenueToday = todayTransactions.reduce(
      (sum, t) => sum + (t.total || 0),
      0
    );
    const activePiutang = transactions
      .filter((t) => t.paymentMethod?.toLowerCase().includes("piutang"))
      .reduce((sum, t) => sum + (t.total || 0), 0);

    const DAILY_TARGET = 5000000;
    const targetProgress = Math.min(
      Math.round((revenueToday / DAILY_TARGET) * 100),
      100
    );

    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toDateString();
      const dayTotal = transactions
        .filter((t) => new Date(t.timestamp).toDateString() === dateStr)
        .reduce((sum, t) => sum + (t.total || 0), 0);
      return {
        label: d.toLocaleDateString("id-ID", { weekday: "short" }),
        value: dayTotal,
      };
    });

    const maxDayValue = Math.max(...last7Days.map((d) => d.value), 100000);

    return {
      revenueToday,
      orderCountToday: todayTransactions.length,
      activePiutang,
      targetProgress,
      dailyTargetValue: DAILY_TARGET,
      chartData: last7Days,
      maxDayValue,
    };
  }, [transactions]);

  return (
    <div className={pageStyles.container}>
      {/* Responsive Header */}
      <div className={pageStyles.header}>
        <div>
          <h1 className={`${typography.h1} text-slate-900`}>
            Performance Summary
          </h1>
          <p className={`${typography.caption} mt-1`}>
            Real-time business analytics
          </p>
        </div>
        <button
          onClick={() => onNavigate("pos")}
          className={`${buttonStyles.base} ${buttonStyles.variants.primary} ${buttonStyles.sizes.lg}`}
        >
          <ShoppingBag size={18} /> Transaksi Baru
        </button>
      </div>

      {/* KPI Cards: Grid scales from 1 to 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Card 1: Revenue Today */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={22} />
            </div>
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
              LIVE
            </span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Revenue Hari Ini
          </p>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            {fmtCurrency(stats.revenueToday)}
          </h3>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Package size={22} />
            </div>
            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase">
              Today
            </span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Total Pesanan
          </p>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            {stats.orderCountToday}{" "}
            <span className="text-sm font-medium text-gray-400 italic">
              Pesanan
            </span>
          </h3>
        </div>

        {/* Card 3: Daily Target */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Target size={22} />
            </div>
            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              {stats.targetProgress}%
            </span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Target Harian
          </p>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            {fmtCurrency(stats.dailyTargetValue)}
          </h3>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-1000"
              style={{ width: `${stats.targetProgress}%` }}
            />
          </div>
        </div>

        {/* Card 4: Piutang */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <WalletCards size={22} />
            </div>
            <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
              PENDING
            </span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Piutang Berjalan
          </p>
          <h3 className="text-xl font-black text-rose-600 mt-1">
            {fmtCurrency(stats.activePiutang)}
          </h3>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 sm:p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-500" /> Tren
              Penjualan
            </h3>
            <div className="hidden sm:flex gap-2 items-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Revenue (7 Hari)
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-80 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {stats.chartData.map((day, i) => {
              const height = (day.value / stats.maxDayValue) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div
                    className="w-full bg-slate-50 rounded-2xl relative overflow-hidden transition-all group-hover:bg-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-100"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  >
                    <div className="absolute top-0 inset-x-0 h-1 bg-white/10" />
                  </div>
                  <span className="text-[9px] font-black text-gray-400 uppercase">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center justify-between">
            <span>Laris Hari Ini</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </h3>
          <div className="space-y-4">
            {[
              { name: "Nasi Goreng", val: 45, clr: "bg-emerald-500" },
              { name: "Ayam Bakar", val: 32, clr: "bg-blue-500" },
              { name: "Es Teh Manis", val: 58, clr: "bg-amber-500" },
              { name: "Burger Keju", val: 12, clr: "bg-rose-500" },
            ].map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${p.clr} flex items-center justify-center text-white font-black text-[10px] shadow-sm`}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
                    {p.name}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-400">
                  {p.val}x
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate("items")}
            className="w-full mt-8 py-4 bg-slate-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            Manajemen Stok <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
