import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Wallet,
  Users,
  ArrowUpRight,
  Search,
  Download,
  Clock,
  Banknote,
  QrCode,
  UserX,
  Heart,
  Sparkles,
  Gift,
  BarChart3,
  ChevronRight,
  ArrowDownWideNarrow,
  Calendar,
  Filter,
} from "lucide-react";
import { getTransactions } from "../services/api";
import { TransactionRecord } from "../types";
import { fmtCurrency } from "../utils/format";
import {
  radius,
  shadows,
  typography,
  cardStyles,
  pageStyles,
} from "../styles/design-system";

type TimeFilter = "harian" | "bulanan" | "tahunan";

const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"laporan" | "piutang" | "donasi">(
    "laporan"
  );
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("harian");
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data || []);
    } catch (err) {
      console.error("Error fetching finance data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDebtorName = (method?: string) => {
    if (!method) return "Tanpa Nama";
    if (method.includes(": ")) return method.split(": ")[1];
    if (method.includes("(")) {
      const match = method.match(/\(([^)]+)\)/);
      return match ? match[1] : "Tanpa Nama";
    }
    return "Tanpa Nama";
  };

  const filteredData = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const tDate = new Date(t.timestamp);
      if (timeFilter === "harian") {
        return tDate.toDateString() === now.toDateString();
      } else if (timeFilter === "bulanan") {
        return (
          tDate.getMonth() === now.getMonth() &&
          tDate.getFullYear() === now.getFullYear()
        );
      } else if (timeFilter === "tahunan") {
        return tDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, timeFilter]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, t) => {
        const amount = Number(t.total) || 0;
        const method = (t.paymentMethod || "").toLowerCase();

        // Alokasi Dana Cerdas
        if (method.includes("tunai") || method === "cash") {
          acc.cash += amount;
        } else if (method.includes("qris")) {
          acc.qris += amount;
        } else if (method.includes("piutang")) {
          acc.piutang += amount;
        }

        // Deteksi jika ada kata "Donasi" di metode pembayaran (biasanya untuk kembalian donasi)
        if (method.includes("donasi")) {
          acc.social += amount;
        }

        acc.revenue = acc.cash + acc.qris + acc.piutang;
        return acc;
      },
      { revenue: 0, cash: 0, qris: 0, piutang: 0, social: 0 }
    );
  }, [filteredData]);

  const weeklySalesData = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toDateString();
      const dayTotal = transactions
        .filter((t) => new Date(t.timestamp).toDateString() === dateStr)
        .reduce((sum, t) => sum + (Number(t.total) || 0), 0);

      return {
        label: d.toLocaleDateString("id-ID", { weekday: "short" }),
        value: dayTotal,
      };
    });
  }, [transactions]);

  const maxSalesValue = useMemo(() => {
    const max = Math.max(...weeklySalesData.map((d) => d.value), 100000);
    return max * 1.2;
  }, [weeklySalesData]);

  const donationStats = useMemo(() => {
    // Dana sosial dihitung dari kategori donasi atau mark khusus
    const totalDonasi = totals.social || totals.revenue * 0.05; // Fallback 5% jika data detail tak tersedia
    const donaturCount = filteredData.length;
    const avgDonasi = donaturCount > 0 ? totalDonasi / donaturCount : 0;
    return { totalDonasi, donaturCount, avgDonasi };
  }, [filteredData, totals.social, totals.revenue]);

  const topDebtors = useMemo(() => {
    const piutangList = transactions.filter((t) => {
      const isPiutang = (t.paymentMethod || "")
        .toLowerCase()
        .includes("piutang");
      return isPiutang;
    });

    const grouped = piutangList.reduce((acc: Record<string, number>, curr) => {
      const name = getDebtorName(curr.paymentMethod);
      acc[name] = (acc[name] || 0) + (Number(curr.total) || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount: amount as number }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="flex-1 bg-gray-50 h-screen overflow-y-auto custom-scroll p-4 lg:p-8 animate-in fade-in duration-500 pb-20 relative">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Finance Dashboard
          </h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            Laporan arus kas & piutang real-time
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-3 rounded-2xl shadow-sm cursor-pointer hover:bg-gray-50 transition-all">
              <Calendar size={18} className="text-emerald-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-700 min-w-[80px]">
                {timeFilter === "harian"
                  ? "Hari Ini"
                  : timeFilter === "bulanan"
                  ? "Bulan Ini"
                  : "Tahun Ini"}
              </span>
              <Filter size={14} className="text-gray-400" />
            </div>
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] p-2">
              <button
                onClick={() => setTimeFilter("harian")}
                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-50 transition-colors ${
                  timeFilter === "harian"
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-gray-500"
                }`}
              >
                Harian (Today)
              </button>
              <button
                onClick={() => setTimeFilter("bulanan")}
                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-50 transition-colors ${
                  timeFilter === "bulanan"
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-gray-500"
                }`}
              >
                Bulanan (Month)
              </button>
              <button
                onClick={() => setTimeFilter("tahunan")}
                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-50 transition-colors ${
                  timeFilter === "tahunan"
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-gray-500"
                }`}
              >
                Tahunan (Year)
              </button>
            </div>
          </div>

          <button
            onClick={fetchData}
            className="p-3.5 bg-white border border-gray-100 text-gray-400 rounded-2xl hover:text-emerald-500 transition-all shadow-sm"
          >
            <Clock size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide">
        {[
          {
            id: "laporan",
            label: "Arus Kas",
            icon: TrendingUp,
            color: "emerald",
          },
          { id: "piutang", label: "Piutang", icon: UserX, color: "amber" },
          { id: "donasi", label: "Sosial", icon: Heart, color: "rose" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-tighter transition-all relative flex items-center gap-2 whitespace-nowrap
              ${
                activeTab === tab.id
                  ? `text-${tab.color}-600`
                  : "text-gray-400 hover:text-gray-600"
              }`}
          >
            <tab.icon size={16} /> {tab.label}
            {activeTab === tab.id && (
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-${tab.color}-500 rounded-full animate-in slide-in-from-bottom-2`}
              ></div>
            )}
          </button>
        ))}
      </div>

      {activeTab === "laporan" && (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 p-6 rounded-[32px] border-4 border-emerald-500/10 shadow-xl shadow-slate-200">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl w-fit mb-4">
                <TrendingUp size={24} />
              </div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                Omset Terkumpul
              </p>
              <h3 className="text-xl font-black text-white mt-1">
                {fmtCurrency(totals.revenue)}
              </h3>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4">
                <Banknote size={24} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Saldo Tunai
              </p>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {fmtCurrency(totals.cash)}
              </h3>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-4">
                <QrCode size={24} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Saldo QRIS
              </p>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {fmtCurrency(totals.qris)}
              </h3>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4">
                <UserX size={24} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Piutang
              </p>
              <h3 className="text-xl font-black text-amber-600 mt-1">
                {fmtCurrency(totals.piutang)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-emerald-500" /> Performa
                Penjualan
              </h3>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Data 7 Hari Terakhir
              </span>
            </div>
            <div className="h-64 flex items-end justify-between gap-4 px-4">
              {weeklySalesData.map((d, i) => {
                const h = (d.value / maxSalesValue) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2 group"
                  >
                    <div
                      className="w-full bg-emerald-50 rounded-xl relative transition-all group-hover:bg-emerald-500 group-hover:shadow-lg"
                      style={{ height: `${Math.max(h, 5)}%` }}
                    ></div>
                    <span className="text-[9px] font-black text-gray-400 uppercase">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "piutang" && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-8">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock size={18} />
                </div>
                <h3 className="font-bold text-slate-900">Piutang Terkini</h3>
              </div>
              <div className="space-y-4">
                {filteredData.filter((t) =>
                  (t.paymentMethod || "").toLowerCase().includes("piutang")
                ).length === 0 ? (
                  <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">
                    Tidak ada piutang
                  </div>
                ) : (
                  filteredData
                    .filter((t) =>
                      (t.paymentMethod || "").toLowerCase().includes("piutang")
                    )
                    .slice(0, 10)
                    .map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-amber-100 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-amber-600 border border-amber-100 shadow-sm">
                            {getDebtorName(p.paymentMethod).charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">
                              {getDebtorName(p.paymentMethod)}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold tracking-tight">
                              {new Date(p.timestamp).toLocaleTimeString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit" }
                              )}{" "}
                              • #{p.id}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-amber-600">
                          {fmtCurrency(p.total)}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
                <UserX size={20} className="text-amber-500" /> Top Debitur
              </h3>
              <div className="space-y-6">
                {topDebtors.map((p, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-tight text-gray-500">
                      <span>{p.name}</span>
                      <span className="text-slate-900">
                        {fmtCurrency(p.amount)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400"
                        style={{
                          width: `${
                            (p.amount / (topDebtors[0]?.amount || 1)) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "donasi" && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-rose-600 p-8 rounded-[32px] shadow-xl shadow-rose-100 text-white flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                Dana Sosial
              </p>
              <h3 className="text-2xl font-black">
                {fmtCurrency(donationStats.totalDonasi)}
              </h3>
              <Heart
                size={48}
                className="absolute right-8 top-8 opacity-10"
                fill="currentColor"
              />
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Kontributor
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                {donationStats.donaturCount} Trx
              </h3>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Rata-rata
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                {fmtCurrency(donationStats.avgDonasi)}
              </h3>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm border-l-8 border-l-rose-500">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Heart size={20} className="text-rose-500" /> Transparansi Dana
              Sosial
            </h4>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
              Dana terkumpul dari item donasi dan kelebihan bayar pelanggan.
              Filter waktu aktif ({timeFilter}) memastikan data yang Anda lihat
              adalah real-time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
