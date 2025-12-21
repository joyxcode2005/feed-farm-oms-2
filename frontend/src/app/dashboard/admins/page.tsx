"use client";

import { useCallback, useEffect, useState } from "react";
import { Admin, api } from "@/src/config";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";
import toast from "react-hot-toast";
import { Trash2, Shield, ShieldAlert, Plus } from "lucide-react";

// Absolute import for the modal
import CreateAdminModal from "@/src/components/CreateModal";

export default function AdminsPage() {
  const { admin: currentAdmin } = useAdminAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchAdmins = useCallback(async () => {
    if (!currentAdmin) return;
    try {
      const res = await api.get("/auth/all");
      // FILTER: Exclude the currently logged-in admin from the list
      const otherAdmins = res.data.adminUsers.filter(
        (a: Admin) => a.id !== currentAdmin.id
      );
      setAdmins(otherAdmins);
    } catch {
      toast.error("Failed to fetch admins");
    } finally {
      setIsLoading(false);
    }
  }, [currentAdmin] );

  const deleteAdmin = (id: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-zinc-900">
            Are you sure you want to delete this admin?
          </span>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await api.delete(`/delete/${id}`);
                  fetchAdmins();
                  toast.success("Admin deleted successfully");
                } catch {
                  toast.error("Delete failed");
                }
              }}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-700 rounded-md hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 5000, position: "top-center" }
    );
  };

  useEffect(() => {
    if (currentAdmin) {
      fetchAdmins();
    }
  }, [currentAdmin, fetchAdmins]);

  if (!currentAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Admin Management
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage access and permissions for other administrators.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm rounded-lg hover:opacity-90 transition-opacity cursor-pointer font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-xs text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                      </td>
                      <td colSpan={4}></td>
                    </tr>
                  ))
                : admins.map((a) => (
                    <tr
                      key={a.id}
                      className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {a.name}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                        {a.email}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                        {a.phone}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            a.role === "SUPER_ADMIN"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300"
                              : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {a.role === "SUPER_ADMIN" ? (
                            <ShieldAlert className="w-3 h-3" />
                          ) : (
                            <Shield className="w-3 h-3" />
                          )}
                          {a.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* DELETE BUTTON: Only visible if current user is Super Admin and target is regular Admin */}
                        {a.role === "ADMIN" &&
                          currentAdmin.role === "SUPER_ADMIN" && (
                            <button
                              onClick={() => deleteAdmin(a.id)}
                              className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all"
                              title="Remove Admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCreating && (
        <CreateAdminModal
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            fetchAdmins();
          }}
        />
      )}
    </div>
  );
}
