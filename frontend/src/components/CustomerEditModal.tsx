/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { WEST_BENGAL_DISTRICTS } from "../constants/districts";

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
  district: string;
  address: string | null;
}

export default function CustomerEditModal({
  customer,
  onClose,
  onUpdated,
}: {
  customer: Customer;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone,
    type: customer.type,
    district: customer.district,
    address: customer.address || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/customers/${customer.id}`, form);
      toast.success("Customer details updated");
      onUpdated();
      onClose();
    } catch (error) {
      toast.error("Failed to update customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-lg font-semibold">Update Customer Details</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              className="w-full px-3 py-2 rounded-lg border dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                required
                className="w-full px-3 py-2 rounded-lg border dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                className="w-full px-3 py-2 rounded-lg border dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="SINGLE">Individual</option>
                <option value="DISTRIBUTER">Distributor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">District</label>
            <select
              className="w-full px-3 py-2 rounded-lg border dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            >
              {WEST_BENGAL_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 py-2 rounded-lg font-medium flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}