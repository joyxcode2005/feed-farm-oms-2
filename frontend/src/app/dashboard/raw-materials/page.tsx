"use client";

import { useState } from "react";
import { api } from "@/src/config";
import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Modal Components
import AdjustmentModal from "@/src/components/AdjustmentModal";
import CreateRawMaterialModal from "@/src/components/CreateRawMaterialModal";
import LedgerModal from "@/src/components/LedgerModal";
import StockActionModal from "@/src/components/StockActionModal";

interface RawMaterial {
  id: string;
  name: string;
  unit: "KG" | "TON";
  currentStock: number;
}

export default function RawMaterialsPage() {
  const queryClient = useQueryClient();

  // 1. Fetch Materials with TanStack Query
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: async () => {
      const res = await api.get("/raw-materials");
      return res.data.data as RawMaterial[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [stockAction, setStockAction] = useState<"IN" | "OUT" | null>(null);
  const [ledgerMaterial, setLedgerMaterial] = useState<RawMaterial | null>(null);
  const [adjustmentMaterial, setAdjustmentMaterial] = useState<RawMaterial | null>(null);

  const openStockModal = (material: RawMaterial, type: "IN" | "OUT") => {
    setSelectedMaterial(material);
    setStockAction(type);
  };

  // Helper to refresh data
  const refreshInventory = () => {
    queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Raw Material Inventory
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track stock levels, replenish inventory, and manage material usage.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Material
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">
                  Material Name
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">
                  Unit Type
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">
                  Current Stock
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs text-right">
                  Quick Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-6 py-4 flex justify-end gap-2"><div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  </tr>
                ))
              ) : materials.length > 0 ? (
                materials.map((m: RawMaterial) => (
                  <tr
                    key={m.id}
                    className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {m.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium border border-zinc-200 dark:border-zinc-700">
                        {m.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-semibold ${
                            m.currentStock < 0 ? "text-red-600" : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {m.currentStock.toLocaleString()}
                        </span>
                        <span className="text-zinc-400 text-xs mt-1">{m.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => openStockModal(m, "IN")}
                        className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-100 transition-colors"
                      >
                        Stock In
                      </button>
                      <button
                        onClick={() => openStockModal(m, "OUT")}
                        className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-100 transition-colors"
                      >
                        Stock Out
                      </button>
                      <button
                        onClick={() => setAdjustmentMaterial(m)}
                        className="px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-md border border-violet-100 transition-colors"
                      >
                        Adjust
                      </button>
                      <button
                        onClick={() => setLedgerMaterial(m)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-100 transition-colors"
                      >
                        Ledger
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-500">
                    No materials found. Get started by adding raw materials.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conditional Modals with cache invalidation */}
      {isCreating && (
        <CreateRawMaterialModal
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            refreshInventory();
          }}
        />
      )}

      {selectedMaterial && stockAction && (
        <StockActionModal
          material={selectedMaterial}
          type={stockAction}
          onClose={() => {
            setSelectedMaterial(null);
            setStockAction(null);
          }}
          onSuccess={() => {
            setSelectedMaterial(null);
            setStockAction(null);
            refreshInventory();
          }}
        />
      )}

      {ledgerMaterial && (
        <LedgerModal
          material={ledgerMaterial}
          onClose={() => setLedgerMaterial(null)}
        />
      )}

      {adjustmentMaterial && (
        <AdjustmentModal
          material={adjustmentMaterial}
          onClose={() => setAdjustmentMaterial(null)}
          onSuccess={() => {
            setAdjustmentMaterial(null);
            refreshInventory();
          }}
        />
      )}
    </div>
  );
}