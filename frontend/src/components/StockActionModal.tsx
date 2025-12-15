/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { X, Loader2, ArrowDown, ArrowUp } from "lucide-react";

interface Props {
  material: { id: string; name: string; unit: string };
  type: "IN" | "OUT";
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockActionModal({ material, type, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Prepare payload (convert quantity to number)
    const payload = {
      quantity: Number(formData.quantity),
      notes: formData.notes,
    };

    try {
      // Endpoint changes based on type
      const endpoint = type === "IN" 
        ? `/raw-materials/${material.id}/stock/in`
        : `/raw-materials/${material.id}/stock/out`;

      await api.post(endpoint, payload);
      toast.success(type === "IN" ? "Stock added successfully" : "Stock removed successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const isStockIn = type === "IN";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isStockIn ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
               {isStockIn ? <ArrowDown className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {isStockIn ? "Add Stock" : "Remove Stock"}
              </h3>
              <p className="text-xs text-zinc-500">{material.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Quantity ({material.unit})
            </label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder={isStockIn ? "e.g. Purchase from Vendor X" : "e.g. Used for Batch #102"}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
                isStockIn 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isStockIn ? "Add Stock" : "Remove Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}