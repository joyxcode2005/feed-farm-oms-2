/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import Dashboard from "@/src/pages/Dashboard";
import Orders from "@/src/pages/Orders";
import Payments from "@/src/pages/Payments";

function AdminDashboardContent() {
  const { admin, loading, logout } = useAdminAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [page, setPage] = useState<SidebarPageType>("Dashboard");

  useEffect(() => {
    // Safety check: searchParams can be null
    if (!searchParams) return;

    const view = searchParams.get("view") as SidebarPageType;
    if (view && view !== page) {
      setPage(view);
    }
  }, [searchParams, page]);

  const handlePageChange = (newPage: SidebarPageType) => {
    setPage(newPage);
    router.push(`/dashboard?view=${newPage}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!admin) return null;

  function renderPage(currentPage: SidebarPageType, currentAdmin: Admin) {
    switch (currentPage) {
      case "Dashboard":
        return <Dashboard onNavigate={handlePageChange} />;
      case "Raw Material Stock":
        return <RawMaterials />;
      case "Finished Feed Stock":
        return <FinishedFeedStock />;
      case "Orders":
        return <Orders />;
      case "Customers":
        return <Customers />;
      case "Payments":
        return <Payments />;
      case "Admins":
        return <Admins currentAdmin={currentAdmin} />;
      case "Settings":
        return <SettingsPage admin={currentAdmin} />;
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
          onChange={handlePageChange}
        />
        <main className="flex-1 p-8">{renderPage(page, admin)}</main>
      </div>
    </div>
  );
}

// Wrapping in Suspense is mandatory when using useSearchParams in Next.js
export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}