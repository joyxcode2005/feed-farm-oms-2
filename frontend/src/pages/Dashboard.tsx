"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  IndianRupee,
  Factory,
  RefreshCcw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { DashboardProps, DashboardStats } from "../types";
import { AnalyticsService } from "../services/analytics.service";
import { SidebarPageType } from "../config";

/**
 * The main Dashboard component provides a high-level overview of the
 * business's financial and operational performance.
 */
export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<"day" | "month" | "year">("day");

  /**
   * Fetches statistics from the analytics service based on the selected period.
   */
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Backend Analytics Engine handles the distinction between Sales and Revenue
      const data = await AnalyticsService.getStats(period, new Date());
      setStats(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while loading dashboard data";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // UI Configuration for the summary cards with targeted navigation
  const statCards = [
    {
      title: "Actual Revenue",
      value: `₹${stats?.totalRevenue.toLocaleString() || 0}`,
      subtitle: "Actual cash flow received",
      icon: <IndianRupee className="text-green-600 w-6 h-6" />,
      color: "bg-green-50",
      targetPage: "Orders" as SidebarPageType,
    },
    {
      title: "Total Sales",
      value: `₹${stats?.totalSales.toLocaleString() || 0}`,
      subtitle: "Gross value of orders placed",
      icon: <TrendingUp className="text-blue-600 w-6 h-6" />,
      color: "bg-blue-50",
      targetPage: "Orders" as SidebarPageType,
    },
    {
      title: "Total Expenses",
      value: `₹${stats?.totalExpenses.toLocaleString() || 0}`,
      subtitle: "Documented business spending",
      icon: <TrendingDown className="text-red-600 w-6 h-6" />,
      color: "bg-red-50",
      targetPage: "Expenses" as SidebarPageType,
    },
    {
      title: "Feed Produced",
      value: `${stats?.totalProductionKg.toLocaleString() || 0} KG`,
      subtitle: `${stats?.totalBatches || 0} Production Batches`,
      icon: <Factory className="text-purple-600 w-6 h-6" />,
      color: "bg-purple-50",
      targetPage: "Finished Feed Stock" as SidebarPageType,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Operational Overview
          </h1>
          <p className="text-gray-500 text-sm">
            Real-time performance metrics and financial summaries
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCcw
              className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
            />
          </button>

          <div className="flex bg-white border rounded-lg p-1 shadow-sm">
            {(["day", "month", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  period === p
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            onClick={() => onNavigate && onNavigate(card.targetPage)}
            className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-xl ${card.color} group-hover:scale-110 transition-transform`}
              >
                {card.icon}
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {period}
              </span>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">
                {card.title}
              </h3>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? (
                  <div className="h-8 w-24 bg-gray-100 animate-pulse rounded" />
                ) : (
                  card.value
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          onClick={() => onNavigate && onNavigate("Orders")}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm cursor-pointer hover:border-blue-200 transition-colors"
        >
          <h3 className="font-bold text-gray-800 mb-6">Volume Analysis</h3>
          <div className="flex items-center gap-6">
            <div className="p-5 bg-blue-50 rounded-2xl">
              <ShoppingCart className="text-blue-600 w-8 h-8" />
            </div>
            <div>
              <div className="text-4xl font-black text-gray-900">
                {loading ? "..." : stats?.totalOrders || 0}
              </div>
              <div className="text-sm font-medium text-gray-500 mt-1">
                Confirmed orders processed this {period}
              </div>
            </div>
          </div>
        </div>

        {/* Business Health Visualization */}
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
          <h3 className="font-bold mb-2">Business Health</h3>
          <p className="text-blue-100 text-xs mb-4">
            Your revenue vs expense ratio for this {period} is currently being
            tracked.
          </p>
          <div className="h-2 w-full bg-blue-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-1000"
              style={{
                width: stats
                  ? `${Math.min(
                      100,
                      (stats.totalRevenue / (stats.totalExpenses || 1)) * 10
                    )}%`
                  : "0%",
              }}
            />
          </div>
          <p className="text-[10px] mt-4 text-blue-200">
            * Ensure all expenses are recorded daily for accurate health
            reporting.
          </p>
        </div>
      </div>
    </div>
  );
}
