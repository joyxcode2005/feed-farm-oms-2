/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { X, Calendar, ArrowDown, ArrowUp, Minus, SearchX } from "lucide-react";

interface LedgerItem {
  id: string;
  type: "PRODUCTION_IN" | "SALE_OUT" | "ADJUSTMENT";
  quantityBags: number;
  orderId?: string;
  productionBatchId?: string;
  notes?: string;
  createdAt: string;
  adminUser: {
    name: string;
  };
}

interface Props {
  item: { feedCategroyId: string; feedName: string };
  onClose: () => void;
}

export default function FinishedFeedLedgerModal({ item, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [selectedDate, setSelectedDate] = useState("");

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      if (selectedDate) {
        /**
         * FIX: Handling Timezone Shift
         * Instead of manually appending "T00:00:00Z", we create a date object
         * from the input string and calculate the exact UTC start and end.
         */
        const localDate = new Date(selectedDate);
        
        // Start of the day (00:00:00 local)
        const start = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 0, 0, 0, 0);
        // End of the day (23:59:59 local)
        const end = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 23, 59, 59, 999);

        params.from = start.toISOString();
        params.to = end.toISOString();
      }

      const res = await api.get(`/finished-feed/${item.feedCategroyId}/ledger`, { params });
      setLedger(res.data.data);
    } catch (error) {
      toast.error("Failed to load ledger history");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, item.feedCategroyId]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-4xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Feed Stock Ledger
            </h3>
            <p className="text-sm text-zinc-500">
              History for <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.feedName}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter UI */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-4 shrink-0 text-zinc-900 dark:text-zinc-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500">Filter by Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          
          {selectedDate && (
            <button 
              onClick={() => setSelectedDate("")}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Show All History
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 z-10">
              <tr>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Action Type</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-center">Quantity</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Processed By</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Reference/Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-28 bg-zinc-100 dark:bg-zinc-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-zinc-100 dark:bg-zinc-800 rounded mx-auto"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-800 rounded"></div></td>
                  </tr>
                ))
              ) : ledger.length > 0 ? (
                ledger.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400 font-medium">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {!selectedDate && <span className="block text-[10px] text-zinc-400">{new Date(log.createdAt).toLocaleDateString()}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight border shadow-sm ${
                        log.type === "PRODUCTION_IN" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                          : log.type === "SALE_OUT"
                          ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                          : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                      }`}>
                        {log.type === "PRODUCTION_IN" && <ArrowDown className="w-3 h-3" />}
                        {log.type === "SALE_OUT" && <ArrowUp className="w-3 h-3" />}
                        {log.type === "ADJUSTMENT" && <Minus className="w-3 h-3" />}
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-zinc-900 dark:text-zinc-100 text-center">
                      {log.quantityBags} Bags
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {log.adminUser?.name || "System"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {log.notes && <span className="text-zinc-900 dark:text-zinc-200 line-clamp-1 italic text-xs">"{log.notes}"</span>}
                        {log.productionBatchId && (
                          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded w-fit">
                            Batch: #{log.productionBatchId.slice(0,8)}
                          </span>
                        )}
                        {log.orderId && (
                          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded w-fit">
                            Order: #{log.orderId.slice(0,8)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                      <SearchX className="w-10 h-10 stroke-1" />
                      <p className="text-sm">No transactions found for {selectedDate ? new Date(selectedDate).toLocaleDateString() : "this period"}.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}