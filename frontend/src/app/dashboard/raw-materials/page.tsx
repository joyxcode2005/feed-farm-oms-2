"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

// Modular Imports
import { InventoryService } from "@/src/services/inventory.service";
import { RawMaterial } from "@/src/types";

// Modal Components
import AdjustmentModal from "@/src/components/AdjustmentModal";
import CreateRawMaterialModal from "@/src/components/CreateRawMaterialModal";
import LedgerModal from "@/src/components/LedgerModal";
import StockActionModal from "@/src/components/StockActionModal";

export default function RawMaterialsPage() {
  const queryClient = useQueryClient();

  // Fetch Materials via Service
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: InventoryService.getRawMaterials,
    staleTime: 1000 * 60 * 5,
  });

  // Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(
    null
  );
  const [stockAction, setStockAction] = useState<"IN" | "OUT" | null>(null);
  const [ledgerMaterial, setLedgerMaterial] = useState<RawMaterial | null>(
    null
  );
  const [adjustmentMaterial, setAdjustmentMaterial] =
    useState<RawMaterial | null>(null);

  const openStockModal = (material: RawMaterial, type: "IN" | "OUT") => {
    setSelectedMaterial(material);
    setStockAction(type);
  };

  const refreshInventory = () => {
    queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
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
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium rounded-lg hover:opacity-90 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Material
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr className="uppercase tracking-wider text-xs text-zinc-500">
                <th className="px-6 py-4 font-medium">Material Name</th>
                <th className="px-6 py-4 font-medium">Unit</th>
                <th className="px-6 py-4 font-medium">Current Stock</th>
                <th className="px-6 py-4 font-medium text-right">
                  Quick Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse h-16">
                    <td colSpan={4} />
                  </tr>
                ))
              ) : materials.length > 0 ? (
                materials.map((m) => (
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
                            m.currentStock < 0
                              ? "text-red-600"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {m.currentStock.toLocaleString()}
                        </span>
                        <span className="text-zinc-400 text-xs mt-1">
                          {m.unit}
                        </span>
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
                    No materials found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
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
