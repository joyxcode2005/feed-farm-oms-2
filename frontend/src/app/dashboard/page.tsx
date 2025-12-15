"use client";

import { useState } from "react";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";
import AdminHeader from "@/src/components/AdminHeader";
import Sidebar from "@/src/components/Sidebar";
import { Admin, SidebarPageType } from "@/src/config";
import { sidebarItems } from "@/src/helpers/sidebarItems";
import Admins from "@/src/pages/Admins";
import SettingsPage from "@/src/pages/Settings";

export default function AdminPage() {
  const { admin, loading, logout } = useAdminAuth();
  const [page, setPage] = useState<SidebarPageType>("Dashboard");

  // Check if still loading then show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!admin) return null;

  // This is a function which renders page based on current state
  function renderPage(page: SidebarPageType, admin: Admin) {
    switch (page) {
      case "Dashboard":
        return <div>Dashboard Page</div>;

      case "Raw Material Stock":
        return <div>Raw Material Stock</div>;

      case "Finished Feed Stock":
        return <div>Finished Feed Stock</div>;

      case "Orders":
        return <div>Orders</div>;

      case "Admins":
        return <Admins currentAdmin={admin} />;

      case "Settings":
        return <SettingsPage admin={admin} />;

      default:
        return <div>Page not found</div>;
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AdminHeader admin={admin} onLogout={logout} />
      <div className="flex">
        <Sidebar
          activePage={page}
          items={sidebarItems}
          onChange={(newPage) => setPage(newPage)}
        />
        <main className="flex-1 p-8">{renderPage(page, admin)}</main>
      </div>
    </div>
  );
}
