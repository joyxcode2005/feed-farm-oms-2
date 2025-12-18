/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { X, Loader2, Plus, Trash2 } from "lucide-react";

interface AnimalType {
  id: string;
  name: string;
}

interface FeedCategoryForm {
  name: string;
  unitSizeKg: string;
  defaultPrice: string;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateFeedCategoryModal({ onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [selectedAnimalTypeId, setSelectedAnimalTypeId] = useState("");
  
  // Support multiple feed categories at once
  const [categories, setCategories] = useState<FeedCategoryForm[]>([
    { name: "", unitSizeKg: "50", defaultPrice: "" }
  ]);

  // Fetch animal types on mount
  useEffect(() => {
    const fetchAnimalTypes = async () => {
      try {
        const res = await api.get("/animal-types");
        setAnimalTypes(res.data.data);
      } catch (error) {
        toast.error("Failed to load animal types");
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchAnimalTypes();
  }, []);

  const handleCategoryChange = (index: number, field: keyof FeedCategoryForm, value: string) => {
    const newCategories = [...categories];
    newCategories[index][field] = value;
    setCategories(newCategories);
  };

  const addCategoryRow = () => {
    setCategories([...categories, { name: "", unitSizeKg: "50", defaultPrice: "" }]);
  };

  const removeCategoryRow = (index: number) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAnimalTypeId) {
      return toast.error("Please select an animal type");
    }

    // Filter out empty rows
    const validCategories = categories.filter(
      c => c.name.trim() && c.defaultPrice
    );

    if (validCategories.length === 0) {
      return toast.error("Please add at least one feed category");
    }

    setLoading(true);

    try {
      // Create each category sequentially
      const promises = validCategories.map(category =>
        api.post("/feed-categories", {
          animalTypeId: selectedAnimalTypeId,
          name: category.name.trim(),
          unitSizeKg: Number(category.unitSizeKg),
          defaultPrice: Number(category.defaultPrice)
        })
      );

      await Promise.all(promises);
      
      toast.success(`${validCategories.length} feed ${validCategories.length === 1 ? 'category' : 'categories'} created successfully`);
      onCreated();
    } catch (error: any) {
      const message = error.response?.data?.message;
      if (message?.includes("already exists")) {
        toast.error("One or more feed categories already exist for this animal type");
      } else {
        toast.error(message || "Failed to create feed categories");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 my-8">
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Add Feed Categories
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Create one or multiple feed categories for an animal type
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Animal Type Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Animal Type <span className="text-red-500">*</span>
            </label>
            {loadingTypes ? (
              <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
            ) : (
              <select
                required
                value={selectedAnimalTypeId}
                onChange={(e) => setSelectedAnimalTypeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Select Animal Type...</option>
                {animalTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Feed Categories Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Feed Categories <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addCategoryRow}
                className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus className="w-3 h-3" /> Add More
              </button>
            </div>

            <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
              {categories.map((category, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start">
                  {/* Feed Name */}
                  <div className="col-span-5">
                    <input
                      required
                      type="text"
                      placeholder="Feed name (e.g., Starter, Grower)"
                      value={category.name}
                      onChange={(e) => handleCategoryChange(index, "name", e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Unit Size */}
                  <div className="col-span-3">
                    <div className="relative">
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="Unit size"
                        value={category.unitSizeKg}
                        onChange={(e) => handleCategoryChange(index, "unitSizeKg", e.target.value)}
                        className="w-full px-3 py-2 pr-8 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                        kg
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                        ₹
                      </span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={category.defaultPrice}
                        onChange={(e) => handleCategoryChange(index, "defaultPrice", e.target.value)}
                        className="w-full pl-6 pr-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeCategoryRow(index)}
                      disabled={categories.length === 1}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-zinc-500">
              Add multiple feed categories at once for the selected animal type
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingTypes}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create {categories.filter(c => c.name.trim()).length > 1 ? 'Categories' : 'Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}