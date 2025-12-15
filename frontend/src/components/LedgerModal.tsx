/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { X, Calendar, ArrowDown, ArrowUp, Minus } from "lucide-react";

interface LedgerItem {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
  adminUser: {
    name: string;
  };
}

interface Props {
  material: { id: string; name: string; unit: string };
  onClose: () => void;
}

export default function LedgerModal({ material, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  
  // Optional: Date filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // FIX: Wrap in useCallback to stabilize the function reference
  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await api.get(`/raw-materials/${material.id}/ledger`, { params });
      setLedger(res.data.data.ledger);
    } catch (error) {
      toast.error("Failed to load ledger history");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, material.id]); // Dependencies for the fetch function itself

  // FIX: Add fetchLedger to the dependency array
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
              Stock Ledger
            </h3>
            <p className="text-sm text-zinc-500">
              History for <span className="font-medium text-zinc-700 dark:text-zinc-300">{material.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-wrap gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>
          {(fromDate || toDate) && (
            <button 
              onClick={() => { setFromDate(""); setToDate(""); }}
              className="text-xs text-indigo-600 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">By User</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Notes / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                // Skeleton rows
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-zinc-100 dark:bg-zinc-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-zinc-100 dark:bg-zinc-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-800 rounded"></div></td>
                  </tr>
                ))
              ) : ledger.length > 0 ? (
                ledger.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === "IN" 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : item.type === "OUT"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {item.type === "IN" && <ArrowDown className="w-3 h-3" />}
                        {item.type === "OUT" && <ArrowUp className="w-3 h-3" />}
                        {item.type === "ADJUSTMENT" && <Minus className="w-3 h-3" />}
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {item.quantity} {material.unit}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {item.adminUser?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {item.notes && <span className="text-zinc-900 dark:text-zinc-200">{item.notes}</span>}
                        {item.referenceId && (
                          <span className="text-xs text-zinc-500 font-mono">
                            Ref: {item.referenceType} #{item.referenceId.slice(0,8)}...
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    No transactions found for this period.
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