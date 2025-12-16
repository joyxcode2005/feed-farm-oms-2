/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/config";
import { 
  Users, 
  Package, 
  Factory, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight 
} from "lucide-react";
import Link from "next/link"; // If you aren't using Next.js Link in sidebar, standard onClick is fine, but this is a page.

export default function Dashboard({ onNavigate }: { onNavigate: (page: any) => void }) {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalRawMaterials: 0,
    totalFeedBags: 0,
    lowStockMaterials: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Parallel fetch for dashboard data
        const [customersRes, materialsRes, feedRes] = await Promise.all([
          api.get("/customers"),
          api.get("/raw-materials"),
          api.get("/finished-feed/stock"),
        ]);

        const materials = materialsRes.data.data;
        const feed = feedRes.data.data;

        // Calculate stats
        const totalFeedBags = feed.reduce((acc: number, item: any) => acc + (item.quantityAvailableBags || 0), 0);
        const lowStock = materials
          .filter((m: any) => m.currentStock < 100) // Threshold for "Low Stock"
          .slice(0, 5); // Top 5

        setStats({
          totalCustomers: customersRes.data.data ? customersRes.data.data.length : (customersRes.data.customers || []).length,
          totalRawMaterials: materials.length,
          totalFeedBags: Math.floor(totalFeedBags), // Round down just in case
          lowStockMaterials: lowStock,
        });
      } catch (error) {
        console.error("Dashboard fetch failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Shared Card Component
  const StatCard = ({ title, value, icon: Icon, colorClass, onClick }: any) => (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {loading ? <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"/> : value}
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClass} group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Overview
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Welcome back. Here is what is happening at the farm today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          onClick={() => onNavigate("Customers")}
        />
        <StatCard
          title="Raw Materials"
          value={stats.totalRawMaterials}
          icon={Package}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          onClick={() => onNavigate("Raw Material Stock")}
        />
        <StatCard
          title="Finished Feed (Bags)"
          value={stats.totalFeedBags.toLocaleString()}
          icon={Factory}
          colorClass="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
          onClick={() => onNavigate("Finished Feed Stock")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Low Stock Alerts</h3>
            </div>
            <button 
              onClick={() => onNavigate("Raw Material Stock")}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="flex-1 p-0">
            {loading ? (
               <div className="p-4 space-y-3">
                 {[1,2,3].map(i => <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />)}
               </div>
            ) : stats.lowStockMaterials.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {stats.lowStockMaterials.map((m) => (
                  <div key={m.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{m.name}</p>
                      <p className="text-xs text-zinc-500">Unit: {m.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600">{m.currentStock}</p>
                      <p className="text-[10px] text-amber-600/80 font-medium bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">Low Stock</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 text-sm">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No items are currently low on stock.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Getting Started */}
        <div className="bg-linear-to-br from-indigo-500 to-violet-600 rounded-xl shadow-sm text-white p-6 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-black opacity-10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">Manage Production</h3>
            <p className="text-indigo-100 text-sm mb-6 max-w-sm">
              Record new production batches, manage feed formulas, or update your inventory levels directly from here.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => onNavigate("Finished Feed Stock")}
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                Record Production
              </button>
              <button 
                 onClick={() => onNavigate("Raw Material Stock")}
                 className="bg-indigo-700/50 hover:bg-indigo-700/70 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Stock In Material
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}