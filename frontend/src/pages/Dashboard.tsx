/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/config";
import {
  Users,
  Package,
  Factory,
  AlertTriangle,
  IndianRupee,
  ShoppingCart,
  CheckCircle2,
} from "lucide-react";

export default function Dashboard({
  onNavigate,
}: {
  onNavigate: (page: any) => void;
}) {
  const [summaries, setSummaries] = useState({
    orders: {
      totals: { finalAmount: 0, paidAmount: 0, dueAmount: 0 },
      totalOrders: 0,
    },
    feed: { totalProduced: 0, totalSold: 0 },
    rawMaterials: { totalIn: 0, totalOut: 0 },
  });
  const [stats, setStats] = useState({
    totalCustomers: 0,
    lowStockMaterials: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const params = {
          from: thirtyDaysAgo.toISOString(),
          to: today.toISOString(),
        };

        const [custRes, matRes,, ordSum, feedSum, rawSum] =
          await Promise.all([
            api.get("/customers"),
            api.get("/raw-materials"),
            api.get("/finished-feed/stock"),
            api.get("/orders/summary", { params }),
            api.get("/finished-feed/summary", { params }),
            api.get("/raw-materials/summary", { params }),
          ]);

        // REFINED LOW STOCK LOGIC:
        // KG < 10 and TON < 5
        const lowStock = matRes.data.data
          .filter((m: any) => {
            if (m.unit === "KG") return m.currentStock < 10;
            if (m.unit === "TON") return m.currentStock < 5;
            return false;
          })
          .slice(0, 5);

        setStats({
          totalCustomers: custRes.data.data?.length || 0,
          lowStockMaterials: lowStock,
        });

        setSummaries({
          orders: ordSum.data,
          feed: feedSum.data,
          rawMaterials: rawSum.data,
        });
      } catch (error) {
        console.error("Dashboard fetch failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const SummaryCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase">{title}</p>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {loading ? "..." : value}
          </h3>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Farm Performance
        </h2>
        <p className="text-sm text-zinc-500">Overview of the last 30 days.</p>
      </header>

      {/* Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Revenue"
          value={`₹${summaries.orders.totals.finalAmount.toLocaleString()}`}
          icon={IndianRupee}
          color="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          title="Collected"
          value={`₹${summaries.orders.totals.paidAmount.toLocaleString()}`}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          title="Outstanding"
          value={`₹${summaries.orders.totals.dueAmount.toLocaleString()}`}
          icon={AlertTriangle}
          color="bg-rose-50 text-rose-600"
        />
        <SummaryCard
          title="Orders"
          value={summaries.orders.totalOrders}
          icon={ShoppingCart}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finished Feed Summary */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Factory className="w-4 h-4" /> Feed Production
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <p className="text-xs text-indigo-600 font-semibold uppercase">
                Produced
              </p>
              <p className="text-2xl font-bold">
                {summaries.feed.totalProduced} Bags
              </p>
            </div>
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
              <p className="text-xs text-violet-600 font-semibold uppercase">
                Sold
              </p>
              <p className="text-2xl font-bold">
                {summaries.feed.totalSold} Bags
              </p>
            </div>
          </div>
        </div>

        {/* Raw Materials Summary */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" /> Material Usage
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-xs text-emerald-600 font-semibold uppercase">
                Purchased (In)
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {summaries.rawMaterials.totalIn.toLocaleString()} kg
              </p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-xs text-amber-600 font-semibold uppercase">
                Consumed (Out)
              </p>
              <p className="text-2xl font-bold text-amber-600">
                {summaries.rawMaterials.totalOut.toLocaleString()} kg
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Alerts */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-rose-600">
          <AlertTriangle className="w-4 h-4" /> Low Stock Alerts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.lowStockMaterials.length > 0 ? (
            stats.lowStockMaterials.map((m: any) => (
              <div
                key={m.id}
                className="flex flex-col p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-lg"
              >
                <span className="text-xs font-semibold text-rose-600 uppercase mb-1">
                  {m.unit} based material
                </span>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {m.name}
                  </span>
                  <span className="font-black text-rose-600">
                    {m.currentStock} {m.unit}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500 italic py-4">
              All materials are currently above the threshold.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
