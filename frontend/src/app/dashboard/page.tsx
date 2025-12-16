"use client";

import { useState } from "react";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";
import AdminHeader from "@/src/components/AdminHeader";
import Sidebar from "@/src/components/Sidebar";
import { Admin, SidebarPageType } from "@/src/config";
import { sidebarItems } from "@/src/helpers/sidebarItems";
import Admins from "@/src/pages/Admins";
import SettingsPage from "@/src/pages/Settings";
import MapPage from "@/src/pages/MapPage";
import RawMaterials from "@/src/pages/RawMaterials";
import FinishedFeedStock from "@/src/pages/FinishedFeedStock";
import Customers from "@/src/pages/Customers";
import Dashboard from "@/src/pages/Dashboard"; // <--- Import

export default function AdminPage() {
  const { admin, loading, logout } = useAdminAuth();
  const [page, setPage] = useState<SidebarPageType>("Dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!admin) return null;

  function renderPage(page: SidebarPageType, admin: Admin) {
    switch (page) {
      case "Dashboard":
        return <Dashboard onNavigate={(p) => setPage(p)} />; // <--- Update

      case "Raw Material Stock":
        return <RawMaterials />;

      case "Finished Feed Stock":
        return <FinishedFeedStock />;

      case "Orders":
        return <div>Orders</div>;

      case "Customers":
        return <Customers />;

      case "Admins":
        return <Admins currentAdmin={admin} />;

      case "Settings":
        return <SettingsPage admin={admin} />;

      case "Map":
        return <MapPage />;

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