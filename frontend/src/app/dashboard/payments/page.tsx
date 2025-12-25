/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { Search, User, AlertCircle } from "lucide-react";

interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  district: string;
  totalPurchased: number;
  totalPaid: number;
  totalOutstanding: number;
}

export default function CustomerFinancialSummaryPage() {
  const [summaries, setSummaries] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchSummary = async () => {
    try {
      // FIXED: Path now correctly includes '/customers'
      const res = await api.get("/customers/financial-summary");
      setSummaries(res.data.data);
    } catch (error) {
      console.error("Failed to load summary.", error);
      toast.error("Failed to load customer financial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const filtered = summaries.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Customer Ledgers
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Consolidated totals for all customer transactions.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search name or phone..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-500">Customer Name</th>
              <th className="px-6 py-4 font-medium text-zinc-500 text-right">Total Purchased</th>
              <th className="px-6 py-4 font-medium text-zinc-500 text-right">Total Paid</th>
              <th className="px-6 py-4 font-medium text-zinc-500 text-right">Outstanding</th>
              <th className="px-6 py-4 font-medium text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <tr className="animate-pulse"><td colSpan={5} className="h-24 bg-zinc-50/50" /></tr>
            ) : filtered.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</span>
                    <span className="text-xs text-zinc-500">{item.phone}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-medium">₹{item.totalPurchased.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-medium text-emerald-600">₹{item.totalPaid.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-bold text-red-600">₹{item.totalOutstanding.toLocaleString()}</td>
                <td className="px-6 py-4">
                  {item.totalOutstanding > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      <AlertCircle className="w-3 h-3" /> Due
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Clear</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}