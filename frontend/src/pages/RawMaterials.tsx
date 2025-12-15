/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { Plus, Minus, Package, History, SlidersHorizontal } from "lucide-react";
import CreateRawMaterialModal from "../components/CreateRawMaterialModal";
import StockActionModal from "../components/StockActionModal";
import LedgerModal from "../components/LedgerModal";
import AdjustmentModal from "../components/AdjustmentModal";

// Define the interface based on your API response
interface RawMaterial {
  id: string;
  name: string;
  unit: "KG" | "TON";
  currentStock: number;
}

export default function RawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(
    null
  );
  const [stockAction, setStockAction] = useState<"IN" | "OUT" | null>(null);

  // Specific state for Ledger and Adjustment modals
  const [ledgerMaterial, setLedgerMaterial] = useState<RawMaterial | null>(
    null
  );
  const [adjustmentMaterial, setAdjustmentMaterial] =
    useState<RawMaterial | null>(null);

  const fetchMaterials = async () => {
    try {
      const res = await api.get("/raw-materials");
      setMaterials(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch raw materials");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const openStockModal = (material: RawMaterial, type: "IN" | "OUT") => {
    setSelectedMaterial(material);
    setStockAction(type);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Table Container */}
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
                // SKELETON LOADER
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                        <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : materials.length > 0 ? (
                // DATA ROWS
                materials.map((m) => (
                  <tr
                    key={m.id}
                    className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {m.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* Stock In Button */}
                        <button
                          onClick={() => openStockModal(m, "IN")}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-md transition-colors border border-emerald-100 dark:border-emerald-800/50 cursor-pointer"
                          title="Add Stock (Purchase)"
                        >
                          <Plus className="w-3 h-3" />
                          Stock In
                        </button>

                        {/* Stock Out Button */}
                        <button
                          onClick={() => openStockModal(m, "OUT")}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-md transition-colors border border-amber-100 dark:border-amber-800/50 cursor-pointer"
                          title="Remove Stock (Usage)"
                        >
                          <Minus className="w-3 h-3" />
                          Stock Out
                        </button>

                        {/* Adjustment Button */}
                        <button
                          onClick={() => setAdjustmentMaterial(m)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/30 rounded-md transition-colors border border-violet-100 dark:border-violet-800/50 cursor-pointer"
                          title="Correct Stock Level"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          Adjust
                        </button>

                        {/* View Ledger Button */}
                        <button
                          onClick={() => setLedgerMaterial(m)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition-colors border border-blue-100 dark:border-blue-800/50 cursor-pointer"
                          title="View History"
                        >
                          <History className="w-3 h-3" />
                          View Ledger
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                // EMPTY STATE
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-400">
                      <Package className="w-6 h-6" />
                    </div>
                    <h3 className="text-zinc-900 dark:text-zinc-100 font-medium">
                      No materials found
                    </h3>
                    <p className="text-zinc-500 text-sm mt-1">
                      Get started by adding raw materials.
                    </p>
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
            fetchMaterials();
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
            fetchMaterials();
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
            fetchMaterials();
          }}
        />
      )}
    </div>
  );
}
