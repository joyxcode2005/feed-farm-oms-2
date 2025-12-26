"use client";

import { useState } from "react";
import { api, Admin } from "@/src/config";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DetailItem from "@/src/helpers/DetailItem";
import { Loader2, Edit2 } from "lucide-react";
import EditAdminModal from "@/src/components/EditModal"; // Import the existing modal

export default function SettingsPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // 1. Fetch current admin profile with TanStack Query
  const { data: admin, isLoading } = useQuery({
    queryKey: ["admin-me"],
    queryFn: async () => {
      const res = await api.get("/auth/info"); // Hits /api/v1/admin/auth/info
      return res.data.admin as Admin;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const handleUpdateSuccess = () => {
    // Refresh the profile data after a successful update
    queryClient.invalidateQueries({ queryKey: ["admin-me"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-zinc-100" />
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
          Profile Settings
        </h2>
        <div className="flex items-center gap-3">
          {/* New Update Details Button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm"
          >
            <Edit2 className="w-4 h-4 text-zinc-500" />
            Update Details
          </button>
          <span className="text-xs font-medium px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-800">
            Account Active
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        {/* Header Section: Identity */}
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            {admin.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {admin.name}
            </h3>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="px-3 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                {admin.role.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Body Section: Details Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <DetailItem label="Email Address" value={admin.email} />
          <DetailItem label="Phone Number" value={admin.phone} />
          <DetailItem
            label="Admin ID"
            value={admin.id.toString().padStart(6, "0")}
          />
          <DetailItem label="Account Status" value="Verified Administrator" />
        </div>
      </div>

      {/* Profile Edit Modal Connection */}
      {isEditModalOpen && (
        <EditAdminModal
          admin={admin}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={handleUpdateSuccess}
        />
      )}
    </div>
  );
}