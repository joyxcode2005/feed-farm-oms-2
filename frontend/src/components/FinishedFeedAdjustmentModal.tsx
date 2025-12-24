/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { X, Save, AlertCircle } from "lucide-react";

interface Props {
  item: { 
    feedCategroyId: string; 
    feedName: string; 
    quantityAvailableBags: number 
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function FinishedFeedAdjustmentModal({ item, onClose, onSuccess }: Props) {
  const [actualBags, setActualBags] = useState<string>(
    item.quantityAvailableBags.toString()
  );
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return toast.error("Please provide a reason");

    const newStock = parseInt(actualBags);
    if (isNaN(newStock)) return toast.error("Invalid bag count");

    // Calculate the difference for the backend
    const diff = newStock - item.quantityAvailableBags;

    if (diff === 0) {
      toast.error("No change in stock detected");
      return;
    }

    setLoading(true);
    try {
      await api.post("/finished-feed/adjust", {
        feedCategoryId: item.feedCategroyId, // Maintaining backend typo 'feedCategroyId'
        quantityBags: diff,
        reason: reason.trim()
      });
      
      toast.success("Adjustment saved successfully");
      onSuccess();
    } catch (err) {
      toast.error("Adjustment failed");
    } finally {
      setLoading(false);
    }
  };

  const variance = parseInt(actualBags || "0") - item.quantityAvailableBags;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Adjust Finished Feed Stock
            </h3>
            <p className="text-sm text-zinc-500">{item.feedName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
              <label className="text-xs text-zinc-500 uppercase font-medium">
                System Stock
              </label>
              <div className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                {item.quantityAvailableBags}{" "}
                <span className="text-sm text-zinc-400">Bags</span>
              </div>
            </div>

            <div className="p-3 bg-violet-50 dark:bg-violet-900/10 rounded-lg border border-violet-100 dark:border-violet-800/20">
              <label className="text-xs text-violet-600 dark:text-violet-400 uppercase font-medium">
                Difference
              </label>
              <div
                className={`text-lg font-semibold ${
                  variance < 0
                    ? "text-red-600"
                    : variance > 0
                    ? "text-emerald-600"
                    : "text-zinc-500"
                }`}
              >
                {variance > 0 ? "+" : ""}
                {variance}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Actual Bag Count
            </label>
            <input
              type="number"
              required
              value={actualBags}
              onChange={(e) => setActualBags(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Reason for Adjustment
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-h-20"
              placeholder="e.g., Damaged bags, counting error during audit..."
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200 rounded-lg text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              This will automatically calculate the difference (
              {variance > 0 ? "+" : ""}
              {variance}) and update the feed ledger.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Adjustment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}