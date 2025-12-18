/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { Plus, SlidersHorizontal, Factory, Package, History, Settings, PawPrint } from "lucide-react";
import ProductionModal from "../components/ProductionModal";
import FinishedFeedAdjustmentModal from "../components/FinishedFeedAdjustmentModal";
import CreateAnimalTypeModal from "../components/CreateAnimalTypeModal";
import CreateFeedCategoryModal from "../components/CreateFeedCategoryModal";

// Interface matches the API response structure (note the backend typo 'feedCategroyId')
interface FeedStock {
  feedCategroyId: string;
  animalType: string;
  feedName: string;
  unitSize: number;
  quantityAvailableBags: number;
}

interface AnimalType {
  id: string;
  name: string;
  createdAt: string;
}

interface FeedCategory {
  id: string;
  name: string;
  unitSizeKg: number;
  defaultPrice: number;
  animalType: {
    id: string;
    name: string;
  };
  createdAt: string;
}

type TabType = "stock" | "setup";

export default function FinishedFeedStock() {
  const [activeTab, setActiveTab] = useState<TabType>("stock");
  const [stock, setStock] = useState<FeedStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Setup tab data
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [feedCategories, setFeedCategories] = useState<FeedCategory[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Modals state
  const [isProducing, setIsProducing] = useState(false);
  const [adjustmentItem, setAdjustmentItem] = useState<FeedStock | null>(null);
  const [showAnimalTypeModal, setShowAnimalTypeModal] = useState(false);
  const [showFeedCategoryModal, setShowFeedCategoryModal] = useState(false);

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

  const fetchAnimalTypes = async () => {
    setLoadingTypes(true);
    try {
      const res = await api.get("/animal-types");
      setAnimalTypes(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch animal types");
    } finally {
      setLoadingTypes(false);
    }
  };

  const fetchFeedCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.get("/feed-categories");
      setFeedCategories(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch feed categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    if (activeTab === "setup") {
      fetchAnimalTypes();
      fetchFeedCategories();
    }
  }, [activeTab]);

  const handleAnimalTypeCreated = () => {
    setShowAnimalTypeModal(false);
    fetchAnimalTypes();
  };

  const handleFeedCategoryCreated = () => {
    setShowFeedCategoryModal(false);
    fetchFeedCategories();
    fetchStock(); // Refresh stock as new categories were added
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Feed Management
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Manage production, inventory, and feed configurations.
            </p>
          </div>
          
          {activeTab === "stock" && (
            <button
              onClick={() => setIsProducing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
            >
              <Factory className="w-4 h-4" />
              Record Production
            </button>
          )}

          {activeTab === "setup" && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowAnimalTypeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
              >
                <PawPrint className="w-4 h-4" />
                New Animal Type
              </button>
              <button
                onClick={() => setShowFeedCategoryModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
              >
                <Package className="w-4 h-4" />
                New Feed Category
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("stock")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "stock"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Stock Inventory
            </div>
          </button>
          <button
            onClick={() => setActiveTab("setup")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "setup"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Feed Management
            </div>
          </button>
        </div>
      </div>

      {/* Stock Tab Content */}
      {activeTab === "stock" && (
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
                      No finished feed categories found. Go to Setup to add feed categories.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Setup Tab Content */}
      {activeTab === "setup" && (
        <div className="space-y-6">
          {/* Animal Types Section */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <PawPrint className="w-5 h-5" />
                Animal Types
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {animalTypes.length} {animalTypes.length === 1 ? 'type' : 'types'} registered
              </p>
            </div>

            <div className="p-6">
              {loadingTypes ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : animalTypes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {animalTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center justify-center px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                    >
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {type.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  No animal types added yet
                </div>
              )}
            </div>
          </div>

          {/* Feed Categories Section */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Feed Categories
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {feedCategories.length} {feedCategories.length === 1 ? 'category' : 'categories'} configured
              </p>
            </div>

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
                      Default Price
                    </th>
                    <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {loadingCategories ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div></td>
                      </tr>
                    ))
                  ) : feedCategories.length > 0 ? (
                    feedCategories.map((category) => (
                      <tr
                        key={category.id}
                        className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                          {category.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                            {category.animalType.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                          {category.unitSizeKg} kg
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                          ₹{category.defaultPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500">
                        No feed categories added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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

      {showAnimalTypeModal && (
        <CreateAnimalTypeModal
          onClose={() => setShowAnimalTypeModal(false)}
          onCreated={handleAnimalTypeCreated}
        />
      )}

      {showFeedCategoryModal && (
        <CreateFeedCategoryModal
          onClose={() => setShowFeedCategoryModal(false)}
          onCreated={handleFeedCategoryCreated}
        />
      )}
    </div>
  );
}