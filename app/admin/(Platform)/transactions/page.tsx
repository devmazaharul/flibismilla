"use client";

import { useEffect, useMemo, useState } from "react";

// ==========================================
// 1. Type Definitions
// ==========================================
interface TransactionData {
  id: string;
  bookingRef: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  description: string;
  customerName: string;
  airline: string;
}

interface ApiResponse {
  success: boolean;
  data: TransactionData[];
  meta?: {
    after?: string;
    before?: string;
  };
}

// ==========================================
// 2. Helper Function (API Fetcher)
// ==========================================
async function fetchTransactionsFromAPI(
  limit = 20,
  afterCursor?: string | null
): Promise<ApiResponse> {
  try {
    let url = `/api/dashboard/transactions?limit=${limit}`;
    if (afterCursor) {
      url += `&after=${afterCursor}`;
    }

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    return await res.json();
  } catch (error) {
    console.error("API Call Error:", error);
    return { success: false, data: [] };
  }
}

// ==========================================
// 3. Small UI helpers
// ==========================================
function getStatusBadgeClasses(status: string) {
  const s = status.toLowerCase();

  if (
    ["paid", "completed", "succeeded", "success", "captured"].some((k) =>
      s.includes(k)
    )
  ) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (["pending", "processing", "in_progress"].some((k) => s.includes(k))) {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }

  if (["refunded", "cancelled", "canceled", "void"].some((k) =>
    s.includes(k)
  )) {
    return "bg-red-50 text-red-700 ring-1 ring-red-200";
  }

  if (["failed", "declined", "error"].some((k) => s.includes(k))) {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }

  return "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200";
}

// ==========================================
// 4. Main Page Component
// ==========================================
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");

  // UI state
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("All");

  // --- Derived statistics ---
  const totalRevenue = useMemo(
    () => transactions.reduce((acc, curr) => acc + (curr.amount || 0), 0),
    [transactions]
  );
  const totalBookings = transactions.length;
  const averageOrderValue = useMemo(
    () => (totalBookings ? totalRevenue / totalBookings : 0),
    [totalRevenue, totalBookings]
  );

  // অনন্য status গুলো বের করে filter chip বানাচ্ছি
  const uniqueStatuses = useMemo(
    () =>
      Array.from(new Set(transactions.map((t) => t.status))).filter(Boolean),
    [transactions]
  );

  // Search + Status filter
  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return transactions.filter((t) => {
      const matchStatus =
        activeStatus === "All" ? true : t.status === activeStatus;

      if (!q) return matchStatus;

      const haystack = [
        t.bookingRef,
        t.customerName,
        t.description,
        t.airline,
        t.status,
      ]
        .join(" ")
        .toLowerCase();

      return matchStatus && haystack.includes(q);
    });
  }, [transactions, search, activeStatus]);

  // --- Data Loading Logic ---
  const loadTransactions = async (
    cursor: string | null = null,
    reset = false
  ) => {
    setLoading(true);
    setError("");

    if (reset) {
      setTransactions([]);
      setNextCursor(null);
    }

    try {
      const result = await fetchTransactionsFromAPI(20, cursor);

      if (!result.success) {
        setError("Failed to load data");
        return;
      }

      const newData = result.data || [];

      setTransactions((prev) => (reset ? newData : [...prev, ...newData]));
      setNextCursor(result.meta?.after || null);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while loading transactions");
    } finally {
      setLoading(false);
    }
  };

  // --- Initial Load ---
  useEffect(() => {
    loadTransactions(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // format helpers
  const formatMoney = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 px-4 py-8 text-slate-900 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:gap-8">
        {/* HEADER (title + actions) */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              Duffel Console · Finance
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-slate-900">
              Financial Overview
            </h1>
            <p className="max-w-xl text-sm text-slate-600">
              Track your Duffel bookings, payments, and revenue in real time.
              Filter by status, search by PNR or passenger name, and export
              reports.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              onClick={() => {
                setActiveStatus("All");
                setSearch("");
                loadTransactions(null, true);
              }}
              disabled={loading}
              className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-medium tracking-wide text-slate-700 shadow-2xl shadow-gray-100 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <svg
                  className="-ml-1 mr-2 h-3.5 w-3.5 animate-spin text-slate-600"
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
              {loading ? "Refreshing..." : "Refresh data"}
            </button>

          
          </div>
        </section>

        {/* TOP STATS – BOX CARDS */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-2xl shadow-gray-100">
            <p className="text-xs font-medium text-slate-500">
              Total revenue (loaded)
            </p>
            <p className="mt-1.5 text-xl font-semibold text-slate-900">
              ${formatMoney(totalRevenue)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-2xl shadow-gray-100">
            <p className="text-xs font-medium text-slate-500">
              Total transactions
            </p>
            <p className="mt-1.5 text-xl font-semibold text-slate-900">
              {totalBookings.toLocaleString("en-US")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-2xl shadow-gray-100">
            <p className="text-xs font-medium text-slate-500">
              Average order value
            </p>
            <p className="mt-1.5 text-xl font-semibold text-slate-900">
              ${formatMoney(averageOrderValue)}
            </p>
          </div>
        </section>

        {/* ERROR BANNER */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
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

        {/* FILTER BAR */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xl shadow-gray-100 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="flex-1">
         
            <div className="mt-1 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm shadow-inner focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-400/60">
              <svg
                className="h-4 w-4 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M6.75 11.25a4.5 4.5 0 118.9999.0001A4.5 4.5 0 016.75 11.25z"
                />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by PNR, customer, airline, status..."
                className="h-8 flex-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Status filter chips */}
          <div className="flex flex-wrap gap-2 pt-1 md:justify-end md:pt-0">
            <button
              onClick={() => setActiveStatus("All")}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide transition ${
                activeStatus === "All"
                  ? "border-sky-500 bg-sky-50 text-sky-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              All
            </button>
            {uniqueStatuses.map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`rounded-full cursor-pointer border px-3 py-1 text-[11px] font-medium tracking-wide transition ${
                  activeStatus === status
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        {/* DATA TABLE CARD */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl shadow-gray-100">
          {/* Table header row */}
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Transactions
              </h2>
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-900">
                  {filteredTransactions.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-900">
                  {transactions.length}
                </span>{" "}
                loaded records
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              {nextCursor
                ? "More records available"
                : transactions.length > 0
                ? "End of available data"
                : ""}
            </div>
          </div>

          {/* Scroll container */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-900">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold">
                    Date
                  </th>
                  <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold">
                    PNR / Ref
                  </th>
                  <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold">
                    Description
                  </th>
                  <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold">
                    Customer
                  </th>
                  <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-6 py-3 text-center text-xs font-semibold">
                    Status
                  </th>
                  <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-6 py-3 text-right text-xs font-semibold">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Skeleton rows (initial load) */}
                {loading && transactions.length === 0
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="mb-2 h-3 w-24 rounded bg-slate-200" />
                          <div className="h-3 w-14 rounded bg-slate-100" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-5 w-24 rounded bg-slate-200" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="mb-2 h-3 w-40 rounded bg-slate-200" />
                          <div className="h-3 w-24 rounded bg-slate-100" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200" />
                            <div className="h-3 w-28 rounded bg-slate-200" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="mx-auto h-5 w-20 rounded-full bg-slate-200" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="ml-auto h-3 w-16 rounded bg-slate-200" />
                        </td>
                      </tr>
                    ))
                  : null}

                {/* Real data rows */}
                {!loading &&
                  filteredTransactions.map((txn, index) => (
                    <tr
                      key={txn.id || index}
                      className="group transition-colors hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 align-top">
                        <div className="text-[13px] font-medium text-slate-900">
                          {new Date(txn.date).toLocaleDateString()}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {new Date(txn.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 align-top">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] text-slate-900 ring-1 ring-slate-200">
                          {txn.bookingRef}
                        </span>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <div className="text-sm font-medium text-slate-900">
                          {txn.description}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {txn.airline}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 align-top">
                        <div className="flex items-center">
                          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-[11px] font-semibold uppercase text-sky-700 ring-1 ring-sky-200">
                            {txn.customerName.charAt(0)}
                          </div>
                          <div className="text-sm font-medium text-slate-900">
                            {txn.customerName}
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-center align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusBadgeClasses(
                            txn.status
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {txn.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right align-top">
                        <div className="text-sm font-semibold text-slate-900">
                          {txn.currency} {formatMoney(txn.amount)}
                        </div>
                      </td>
                    </tr>
                  ))}

                {/* No data state */}
                {!loading && filteredTransactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      <p className="text-base font-medium text-slate-800">
                        No transactions found
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Try clearing filters or create new bookings to see
                        activity here.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* LOAD MORE BUTTON */}
          {nextCursor && (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
              <button
                onClick={() => loadTransactions(nextCursor)}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300/50 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-2xl shadow-gray-100 transition hover:border-sky-400 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:px-6 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-slate-500"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.2915A7.962 7.962 0 014 12H0c0 3.042 1.1373 5.8241 3 7.938l3-2.6465z"
                      />
                    </svg>
                    Loading more…
                  </>
                ) : (
                  "Load more transactions"
                )}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}