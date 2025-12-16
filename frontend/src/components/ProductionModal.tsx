/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { X, Loader2, Plus, Trash2 } from "lucide-react";

interface ProductionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductionModal({ onClose, onSuccess }: ProductionModalProps) {
  const [loading, setLoading] = useState(false);
  const [feedCategories, setFeedCategories] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    feedCategoryId: "",
    producedBags: "",
    productionDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [materialsUsed, setMaterialsUsed] = useState<{ rawMaterialId: string; quantityKg: string }[]>([
    { rawMaterialId: "", quantityKg: "" }
  ]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, matsRes] = await Promise.all([
          api.get("/finished-feed/stock"), // Reusing stock endpoint to get categories
          api.get("/raw-materials")
        ]);
        setFeedCategories(catsRes.data.data);
        setRawMaterials(matsRes.data.data);
      } catch (error) {
        toast.error("Failed to load form data");
      }
    };
    fetchData();
  }, []);

  const handleMaterialChange = (index: number, field: string, value: string) => {
    const newMaterials = [...materialsUsed];
    (newMaterials[index] as any)[field] = value;
    setMaterialsUsed(newMaterials);
  };

  const addMaterialRow = () => {
    setMaterialsUsed([...materialsUsed, { rawMaterialId: "", quantityKg: "" }]);
  };

  const removeMaterialRow = (index: number) => {
    if (materialsUsed.length > 1) {
      setMaterialsUsed(materialsUsed.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.feedCategoryId) return toast.error("Select a feed category");

    setLoading(true);
    try {
      // Filter out empty rows and convert types
      const cleanMaterials = materialsUsed
        .filter(m => m.rawMaterialId && m.quantityKg)
        .map(m => ({
          rawMaterialId: m.rawMaterialId,
          quantityKg: Number(m.quantityKg)
        }));

      await api.post("/finished-feed/production", {
        ...formData,
        producedBags: Number(formData.producedBags),
        productionDate: new Date(formData.productionDate),
        materialsUsed: cleanMaterials
      });

      toast.success("Production batch recorded");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record production");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 my-8">
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Record Production Batch
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Feed Category
              </label>
              <select
                required
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                value={formData.feedCategoryId}
                onChange={(e) => setFormData({ ...formData, feedCategoryId: e.target.value })}
              >
                <option value="">Select Feed...</option>
                {feedCategories.map((c: any) => (
                  <option key={c.feedCategroyId} value={c.feedCategroyId}>
                    {c.feedName} ({c.animalType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Production Date
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                value={formData.productionDate}
                onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Produced Quantity (Bags)
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                value={formData.producedBags}
                onChange={(e) => setFormData({ ...formData, producedBags: e.target.value })}
              />
            </div>
          </div>

          {/* Raw Materials Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Raw Materials Consumed
              </label>
              <button
                type="button"
                onClick={addMaterialRow}
                className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus className="w-3 h-3" /> Add Material
              </button>
            </div>
            
            <div className="space-y-2 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
              {materialsUsed.map((row, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <select
                    required
                    className="flex-1 px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    value={row.rawMaterialId}
                    onChange={(e) => handleMaterialChange(index, "rawMaterialId", e.target.value)}
                  >
                    <option value="">Select Material...</option>
                    {rawMaterials.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.unit})
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    required
                    placeholder="Qty"
                    className="w-24 px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    value={row.quantityKg}
                    onChange={(e) => handleMaterialChange(index, "quantityKg", e.target.value)}
                  />
                  
                  <button
                    type="button"
                    onClick={() => removeMaterialRow(index)}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Production
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}