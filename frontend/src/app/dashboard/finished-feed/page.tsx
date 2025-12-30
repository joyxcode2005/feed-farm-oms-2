/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SlidersHorizontal,
  Factory,
  Package,
  History,
  PawPrint,
  Check,
} from "lucide-react";

// Modular Imports
import { InventoryService } from "@/src/services/inventory.service";
import { FeedStock } from "@/src/types";

// Modals
import ProductionModal from "@/src/components/ProductionModal";
import FinishedFeedAdjustmentModal from "@/src/components/FinishedFeedAdjustmentModal";
import CreateAnimalTypeModal from "@/src/components/CreateAnimalTypeModal";
import CreateFeedCategoryModal from "@/src/components/CreateFeedCategoryModal";
import FinishedFeedLedgerModal from "@/src/components/FinishedFeedLedgerModal";

type TabType = "stock" | "setup";

export default function FinishedFeedStockPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("stock");

  // Filtering State
  const [selectedAnimalTypeId, setSelectedAnimalTypeId] = useState<
    string | null
  >(null);

  // Modals state
  const [isProducing, setIsProducing] = useState(false);
  const [adjustmentItem, setAdjustmentItem] = useState<FeedStock | null>(null);
  const [ledgerItem, setLedgerItem] = useState<FeedStock | null>(null);
  const [showAnimalTypeModal, setShowAnimalTypeModal] = useState(false);
  const [showFeedCategoryModal, setShowFeedCategoryModal] = useState(false);

  // 1. Fetch Stock Data
  const { data: stock = [], isLoading: isLoadingStock } = useQuery({
    queryKey: ["feed-stock"],
    queryFn: InventoryService.getFeedStock,
  });

  // 2. Fetch Animal Types
  const { data: animalTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["animal-types"],
    queryFn: InventoryService.getAnimalTypes,
    enabled: activeTab === "setup",
  });

  // 3. Fetch Feed Categories
  const { data: feedCategories = [], isLoading: isLoadingCategories } =
    useQuery({
      queryKey: ["feed-categories"],
      queryFn: InventoryService.getFeedCategories,
      enabled: activeTab === "setup",
    });

  // Logic: Filter categories based on selection
  const filteredFeedCategories = useMemo(() => {
    if (!selectedAnimalTypeId) return feedCategories;
    return feedCategories.filter(
      (cat) => cat.animalType.id === selectedAnimalTypeId
    );
  }, [selectedAnimalTypeId, feedCategories]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["feed-stock"] });
    queryClient.invalidateQueries({ queryKey: ["animal-types"] });
    queryClient.invalidateQueries({ queryKey: ["feed-categories"] });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Feed Management
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Manage production, inventory, and configurations.
            </p>
          </div>

          <div className="flex gap-3">
            {activeTab === "stock" ? (
              <button
                onClick={() => setIsProducing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Factory className="w-4 h-4" /> Record Production
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowAnimalTypeModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 shadow-sm dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <PawPrint className="w-4 h-4" /> New Animal
                </button>
                <button
                  onClick={() => setShowFeedCategoryModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  <Package className="w-4 h-4" /> New Category
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("stock")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "stock"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Inventory Stock
          </button>
          <button
            onClick={() => setActiveTab("setup")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "setup"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Setup & Categories
          </button>
        </div>
      </div>

      {/* STOCK TAB */}
      {activeTab === "stock" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Feed Name</th>
                <th className="px-6 py-4">Animal</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {isLoadingStock ? (
                <tr className="animate-pulse">
                  <td colSpan={5} className="h-16 bg-zinc-50/50 dark:bg-zinc-800/50" />
                </tr>
              ) : (
                stock.map((item) => (
                  <tr
                    key={item.feedCategroyId}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{item.feedName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {item.animalType}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.unitSize} kg</td>
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {item.quantityAvailableBags} Bags
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => setLedgerItem(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded"
                        title="View History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setAdjustmentItem(item)}
                        className="p-2 text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/30 rounded"
                        title="Adjust Stock"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SETUP TAB */}
      {activeTab === "setup" && (
        <div className="space-y-6">
          {/* Filterable Animal Types Grid */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <PawPrint className="w-4 h-4" /> Select Animal Type
              </h3>
              {selectedAnimalTypeId && (
                <button
                  onClick={() => setSelectedAnimalTypeId(null)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Show All Categories
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {isLoadingTypes
                ? [...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-12 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg"
                    />
                  ))
                : animalTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() =>
                        setSelectedAnimalTypeId(
                          type.id === selectedAnimalTypeId ? null : type.id
                        )
                      }
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                        selectedAnimalTypeId === type.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500 ring-2 ring-indigo-600/10"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-500 text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800"
                      }`}
                    >
                      {type.name}
                      {selectedAnimalTypeId === type.id && (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                  ))}
            </div>
          </div>

          {/* Filtered Feed Categories Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <Package className="w-4 h-4" />
                {selectedAnimalTypeId
                  ? "Filtered Feed Categories"
                  : "All Feed Categories"}
              </h3>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Showing {filteredFeedCategories.length} items
              </span>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Feed Name</th>
                  <th className="px-6 py-4">Animal</th>
                  <th className="px-6 py-4">Unit Size</th>
                  <th className="px-6 py-4">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {isLoadingCategories ? (
                  <tr className="animate-pulse">
                    <td colSpan={4} className="h-16" />
                  </tr>
                ) : filteredFeedCategories.length > 0 ? (
                  filteredFeedCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{category.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-xs">
                          {category.animalType.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                        {category.unitSizeKg} kg
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        ₹{category.defaultPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-zinc-500 dark:text-zinc-400 italic"
                    >
                      No categories found for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {isProducing && (
        <ProductionModal
          onClose={() => setIsProducing(false)}
          onSuccess={refreshData}
        />
      )}
      {adjustmentItem && (
        <FinishedFeedAdjustmentModal
          item={adjustmentItem}
          onClose={() => setAdjustmentItem(null)}
          onSuccess={refreshData}
        />
      )}
      {ledgerItem && (
        <FinishedFeedLedgerModal
          item={{
            feedCategroyId: ledgerItem.feedCategroyId,
            feedName: ledgerItem.feedName,
          }}
          onClose={() => setLedgerItem(null)}
        />
      )}
      {showAnimalTypeModal && (
        <CreateAnimalTypeModal
          onClose={() => setShowAnimalTypeModal(false)}
          onCreated={refreshData}
        />
      )}
      {showFeedCategoryModal && (
        <CreateFeedCategoryModal
          onClose={() => setShowFeedCategoryModal(false)}
          onCreated={refreshData}
        />
      )}
    </div>
  );
}