"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ================== Types (from /api/dashboard) ==================

interface KPIData {
  totalRevenue: number;
  netProfit: number;
  potentialRevenue: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  activePackages: number;
  activeDestinations: number;
  activeOffers: number;
  currency: string; // e.g. "USD"
}

interface RevenuePoint {
  name: string; // Month short name (e.g. Jan, Feb)
  value: number;
}

interface CategoryPoint {
  name: string;
  value: number;
  color: string;
}

interface RecentBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  packageTitle: string;
  price: number;
  currency: string;
  status: string;
  pnr: string;
  date: string; // "26 Jan 2025"
}

interface DashboardData {
  kpi: KPIData;
  charts: {
    revenueTrend: RevenuePoint[];
    categoryDistribution: CategoryPoint[];
  };
  recentBookings: RecentBooking[];
}

interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

// ================== Helpers ==================

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatShortNumber = (value: number) => {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return value.toString();
};

function getStatusBadgeClasses(status: string) {
  const s = status?.toLowerCase() || "";
  if (s === "issued" || s === "confirmed")
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (["processing", "held", "pending"].some((x) => s.includes(x)))
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  if (["cancelled", "failed", "expired"].some((x) => s.includes(x)))
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
}

// ================== Dashboard Page ==================

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setError(null);
      setLoading((prev) => (data ? false : true)); // full loader only on first load
      setRefreshing(!!data);

      const res = await fetch("/api/dashboard/data", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");

      const json: DashboardResponse = await res.json();
      if (!json.success) throw new Error("API returned unsuccessful response");

      setData(json.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpi = data?.kpi;
  const revenueTrend = data?.charts.revenueTrend || [];
  const categoryDistribution = data?.charts.categoryDistribution || [];
  const recentBookings = data?.recentBookings || [];
  const currencyCode = kpi?.currency || "USD";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 text-slate-900 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* ================= HEADER CARD ================= */}
        <section className="rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-100 px-6 py-5 md:px-8 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                Travel Agency Dashboard
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Financial overview
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Live snapshot of your bookings, revenue, profit and inventory,
                powered by your Duffel & package data.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={loadDashboard}
                disabled={loading || refreshing}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300/80 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-2xl shadow-gray-100 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {(loading || refreshing) && (
                  <svg
                    className="-ml-1 mr-2 h-4 w-4 animate-spin text-slate-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.3726 0 0 5.3726 0 12h4zm2 5.2915A7.962 7.962 0 014 12H0c0 3.042 1.1373 5.8241 3 7.938l3-2.6465z"
                    />
                  </svg>
                )}
                {loading && !data
                  ? "Loading dashboard..."
                  : refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

            
            </div>
          </div>

          <div className="mt-4 grid gap-4 text-xs sm:grid-cols-3">
            <div>
              <p className="text-slate-500">Total revenue</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {kpi
                  ? `${currencyCode} ${formatCurrency(kpi.totalRevenue)}`
                  : "—"}
              </p>
            </div>
            <div className="sm:text-center">
              <p className="text-slate-500">Net profit</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {kpi
                  ? `${currencyCode} ${formatCurrency(kpi.netProfit)}`
                  : "—"}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-slate-500">Pending value</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {kpi
                  ? `${currencyCode} ${formatCurrency(kpi.potentialRevenue)}`
                  : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* ================ Error ================= */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-2xl shadow-gray-100">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75M12 15.75h.007M3.052 19.2l8.16-14.142a.75.75 0 011.299 0L20.67 19.2a.75.75 0 01-.65 1.125H3.702a.75.75 0 01-.65-1.125z"
                />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* ================ KPI GRID ================= */}
        <section className="grid gap-4 md:grid-cols-4">
          {/* Total revenue / booking */}
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-2xl shadow-gray-100">
            <p className="text-xs font-medium text-slate-500">
              Revenue per booking
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {kpi && kpi.confirmedBookings > 0
                ? `${currencyCode} ${formatCurrency(
                    kpi.totalRevenue / kpi.confirmedBookings
                  )}`
                : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Based on confirmed (issued) bookings
            </p>
          </div>

          {/* Bookings overview */}
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-2xl shadow-gray-100">
            <p className="text-xs font-medium text-slate-500">
              Bookings overview
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {kpi ? kpi.totalBookings.toLocaleString("en-US") : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Confirmed{" "}
              <span className="font-semibold text-emerald-600">
                {kpi?.confirmedBookings ?? 0}
              </span>{" "}
              · Pending{" "}
              <span className="font-semibold text-amber-600">
                {kpi?.pendingBookings ?? 0}
              </span>{" "}
              · Cancelled{" "}
              <span className="font-semibold text-rose-600">
                {kpi?.cancelledBookings ?? 0}
              </span>
            </p>
          </div>

          {/* Inventory */}
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-2xl shadow-gray-100">
            <p className="text-xs font-medium text-slate-500">
              Travel inventory
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {kpi
                ? kpi.activePackages +
                  kpi.activeDestinations +
                  kpi.activeOffers
                : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Packages{" "}
              <span className="font-semibold text-slate-700">
                {kpi?.activePackages ?? 0}
              </span>{" "}
              · Destinations{" "}
              <span className="font-semibold text-slate-700">
                {kpi?.activeDestinations ?? 0}
              </span>{" "}
              · Offers{" "}
              <span className="font-semibold text-slate-700">
                {kpi?.activeOffers ?? 0}
              </span>
            </p>
          </div>

          {/* Profit margin */}
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-2xl shadow-gray-100">
            <p className="text-xs font-medium text-slate-500">Profit margin</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {kpi && kpi.totalRevenue > 0
                ? ((kpi.netProfit / kpi.totalRevenue) * 100).toFixed(1) + "%"
                : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Net profit / confirmed revenue
            </p>
          </div>
        </section>

        {/* ================ CHARTS ================= */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          {/* Revenue Trend Line Chart */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xl shadow-gray-100">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Revenue in the last 6 months
                </h2>
                <p className="text-xs text-slate-500">
                  Based on issued/confirmed bookings
                </p>
              </div>
            </div>

            <div className="h-64">
              {loading && !data ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Loading chart...
                </div>
              ) : revenueTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No confirmed revenue data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueTrend}
                    margin={{ left: -20, right: 10, top: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#9ca3af"
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tick={{ fontSize: 11 }}
                      tickFormatter={formatShortNumber}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value: any) => [
                        `${currencyCode} ${formatCurrency(value as number)}`,
                        "Revenue",
                      ]}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ fontSize: 11 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Revenue"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category Distribution Pie Chart */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xl shadow-gray-100">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Category distribution
                </h2>
                <p className="text-xs text-slate-500">
                  Packages and sold flights by category
                </p>
              </div>
            </div>

            <div className="flex h-64 flex-col items-center justify-center gap-4 sm:flex-row">
              {loading && !data ? (
                <div className="text-sm text-slate-400">Loading chart...</div>
              ) : categoryDistribution.length === 0 ? (
                <div className="text-sm text-slate-400">
                  No package or flight data to display yet.
                </div>
              ) : (
                <>
                  <div className="h-44 w-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {categoryDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="#ffffff"
                              strokeWidth={1}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            fontSize: 11,
                          }}
                          formatter={(value: any, name: any) => [
                            value,
                            name as string,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-2 w-full max-w-xs space-y-2 sm:mt-0 sm:ml-4">
                    {categoryDistribution.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-700">{item.name}</span>
                        </div>
                        <span className="text-slate-500">
                          {item.value.toLocaleString("en-US")}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ================ RECENT BOOKINGS TABLE ================= */}
        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-100">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3.5 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Recent bookings
              </h2>
              <p className="text-xs text-slate-500">
                Latest 8 bookings across flights and packages
              </p>
            </div>
            <div className="text-[11px] text-slate-500">
              {recentBookings.length > 0
                ? `${recentBookings.length} records`
                : ""}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm text-slate-700">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Booking</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && !data ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="mb-2 h-3 w-40 rounded bg-gray-200" />
                        <div className="h-3 w-32 rounded bg-gray-100" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="mb-2 h-3 w-52 rounded bg-gray-200" />
                        <div className="h-3 w-24 rounded bg-gray-100" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-20 rounded-full bg-gray-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 w-24 rounded bg-gray-200" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="ml-auto h-3 w-16 rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : recentBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      There are no bookings to show yet.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 align-top">
                        <div className="text-sm font-medium text-slate-900">
                          {b.customerName}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {b.customerPhone}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="text-sm font-medium text-slate-900">
                          {b.packageTitle}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          PNR:{" "}
                          <span className="font-mono text-[11px] text-slate-700">
                            {b.pnr}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusBadgeClasses(
                            b.status
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="text-sm text-slate-700">
                          {b.date}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right align-top">
                        <span className="text-sm font-semibold text-slate-900">
                          {b.currency || currencyCode}{" "}
                          {formatCurrency(b.price)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}