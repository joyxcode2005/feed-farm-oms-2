"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Admin, api } from "@/src/config";
import toast from "react-hot-toast";

export default function EditAdminModal({
  admin,
  onClose,
  onUpdated,
}: {
  admin: Admin;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
  });

  const submit = async () => {
    try {
      await api.put("/update", form);
      toast.success("Admin updated");
      onClose();
      onUpdated();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Admin</h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <input
          className="w-full mb-3 p-2 border rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="w-full mb-3 p-2 border rounded"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          className="w-full mb-3 p-2 border rounded"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <button
          onClick={submit}
          className="w-full mt-4 bg-zinc-900 text-white py-2 rounded"
        >
          Update
        </button>
      </div>
    </div>
  );
}
