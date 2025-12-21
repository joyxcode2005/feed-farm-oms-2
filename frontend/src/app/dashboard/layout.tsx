"use client";

import AdminHeader from "@/src/components/AdminHeader";
import Sidebar from "@/src/components/Sidebar";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the admin authentication state
  const { admin, loading, logout } = useAdminAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
          <p className="text-sm text-zinc-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  // The useAdminAuth hook redirects to /login if no admin is found,
  // so we return null here to prevent flashing protected content.
  if (!admin) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Consistently display the header with admin info and logout capability */}
      <AdminHeader admin={admin} onLogout={logout} />

      <div className="flex">
        {/* The sidebar we updated in Step 2 */}
        <Sidebar />

        {/* Main content area where individual sub-pages will render */}
        <main className="flex-1 p-8 overflow-y-auto h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
