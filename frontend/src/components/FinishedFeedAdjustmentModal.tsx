/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { X, Save } from "lucide-react";

interface Props {
  item: { feedCategroyId: string; feedName: string; quantityAvailableBags: number };
  onClose: () => void;
  onSuccess: () => void;
}

export default function FinishedFeedAdjustmentModal({ item, onClose, onSuccess }: Props) {
  const [actual, setActual] = useState(item.quantityAvailableBags.toString());
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const diff = Number(actual) - item.quantityAvailableBags;
      if (diff === 0) return toast.error("No change detected");

      await api.post("/finished-feed/adjust", {
        feedCategoryId: item.feedCategroyId, // Note backend typo use
        quantityBags: diff,
        reason
      });
      toast.success("Adjustment saved");
      onSuccess();
    } catch (err) {
      toast.error("Adjustment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-sm">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold text-lg">Adjust Stock: {item.feedName}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Actual Bag Count</label>
            <input 
              type="number" required 
              className="w-full border p-2 rounded"
              value={actual} onChange={e => setActual(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Reason</label>
            <input 
              required 
              className="w-full border p-2 rounded"
              value={reason} onChange={e => setReason(e.target.value)}
            />
          </div>
          <button disabled={loading} className="w-full bg-violet-600 text-white p-2 rounded flex justify-center gap-2">
            <Save className="w-4 h-4" /> Save
          </button>
        </form>
      </div>
    </div>
  );
}