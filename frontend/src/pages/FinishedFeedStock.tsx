/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { Plus, SlidersHorizontal, Factory, Package, History } from "lucide-react";
import ProductionModal from "../components/ProductionModal";
import FinishedFeedAdjustmentModal from "../components/FinishedFeedAdjustmentModal";

// Interface matches the API response structure (note the backend typo 'feedCategroyId')
interface FeedStock {
  feedCategroyId: string;
  animalType: string;
  feedName: string;
  unitSize: number;
  quantityAvailableBags: number;
}

export default function FinishedFeedStock() {
  const [stock, setStock] = useState<FeedStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isProducing, setIsProducing] = useState(false);
  const [adjustmentItem, setAdjustmentItem] = useState<FeedStock | null>(null);

  const fetchStock = async () => {
    try {
      const res = await api.get("/finished-feed/stock");
      setStock(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch feed stock");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Finished Feed Stock
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage production batches and track finished feed inventory.
          </p>
        </div>
        <button
          onClick={() => setIsProducing(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Factory className="w-4 h-4" />
          Record Production
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">
                  Feed Name
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">
                  Animal Type
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">
                  Unit Size
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">
                  Current Stock
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : stock.length > 0 ? (
                stock.map((item) => (
                  <tr
                    key={item.feedCategroyId}
                    className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {item.feedName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {item.animalType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {item.unitSize} kg/bag
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-semibold ${item.quantityAvailableBags < 10 ? "text-amber-600" : "text-zinc-700 dark:text-zinc-300"}`}>
                          {item.quantityAvailableBags.toLocaleString()}
                        </span>
                        <span className="text-zinc-400 text-xs mt-1">Bags</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => setAdjustmentItem(item)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/30 rounded-md transition-colors border border-violet-100 dark:border-violet-800/50"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    No finished feed categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isProducing && (
        <ProductionModal
          onClose={() => setIsProducing(false)}
          onSuccess={() => {
            setIsProducing(false);
            fetchStock();
          }}
        />
      )}

      {adjustmentItem && (
        <FinishedFeedAdjustmentModal
          item={adjustmentItem}
          onClose={() => setAdjustmentItem(null)}
          onSuccess={() => {
            setAdjustmentItem(null);
            fetchStock();
          }}
        />
      )}
    </div>
  );
}