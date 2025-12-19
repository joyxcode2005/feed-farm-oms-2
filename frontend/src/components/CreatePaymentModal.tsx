/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { X, Loader2 } from "lucide-react";

interface CreatePaymentModalProps {
  order: {
    id: string;
    customerName?: string;
    dueAmount: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePaymentModal({ order, onClose, onSuccess }: CreatePaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amountPaid: order.dueAmount,
    paymentMethod: "CASH",
    note: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/payments", {
        orderId: order.id,
        amountPaid: Number(formData.amountPaid),
        paymentMethod: formData.paymentMethod,
        note: formData.note
      });
      toast.success("Payment recorded successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Record Payment</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg text-sm mb-2">
            <p className="text-zinc-500">Order ID: <span className="font-mono text-zinc-700 dark:text-zinc-300">{order.id.slice(0,8)}...</span></p>
            {order.customerName && <p className="text-zinc-500">Customer: <span className="text-zinc-700 dark:text-zinc-300">{order.customerName}</span></p>}
            <p className="text-zinc-500">Due Amount: <span className="text-red-600 font-semibold">₹{order.dueAmount.toFixed(2)}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Amount</label>
            <input
              required
              type="number"
              min="1"
              max={order.dueAmount}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              value={formData.amountPaid}
              onChange={(e) => setFormData({ ...formData, amountPaid: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Payment Method</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            >
              <option value="CASH">Cash</option>
              <option value="ONLINE">Online</option>
              <option value="UPI">UPI</option>
              <option value="BANK">Bank Transfer</option>
              <option value="CREDIT">Credit</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Note (Optional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Ref number, etc."
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}