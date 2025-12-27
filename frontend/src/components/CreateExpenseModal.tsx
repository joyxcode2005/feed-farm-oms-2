/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { X, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_CATEGORIES = [
  "Raw Materials",
  "Salaries/Wages",
  "Electricity/Utility",
  "Rent",
  "Transport/Fuel",
  "Maintenance",
  "Packaging",
  "Others",
];

export default function CreateExpenseModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0], // Default to today
    note: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) return toast.error("Please select or enter a category");
    if (Number(formData.amount) <= 0) return toast.error("Amount must be greater than 0");

    setLoading(true);
    try {
      await api.post("/expenses", {
        ...formData,
        amount: Number(formData.amount),
        expenseDate: new Date(formData.expenseDate),
      });
      
      toast.success("Expense recorded successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Record New Expense
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Category
            </label>
            <div className="space-y-2">
              <select
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="CUSTOM">-- Custom Category --</option>
              </select>
              
              {formData.category === "CUSTOM" || !COMMON_CATEGORIES.includes(formData.category) && formData.category !== "" ? (
                <input
                  placeholder="Enter custom category name"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Amount (₹)
              </label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Date
              </label>
              <input
                required
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Note (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="E.g. Paid for raw material transport"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
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
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 rounded-lg flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}