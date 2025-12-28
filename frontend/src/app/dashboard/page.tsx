"use client";

import { SidebarPageType } from "@/src/config";
import Dashboard from "@/src/pages/Dashboard";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();

  // The original Dashboard component took an 'onNavigate' prop.
  // We provide a function that uses the new router to change paths.

  const handlePageChange = (newPage: SidebarPageType) => {
    // Map the internal keys to the new route structure if necessary
    const routeMap: Record<SidebarPageType, string> = {
      Dashboard: "/dashboard",
      "Raw Material Stock": "/dashboard/raw-materials",
      "Finished Feed Stock": "/dashboard/finished-feed",
      Orders: "/dashboard/orders",
      Refunds: "/dashboard/refunds",
      Customers: "/dashboard/customers",
      Expenses: "/dashboard/expenses",
      Admins: "/dashboard/admins",
      Settings: "/dashboard/settings",
      Map: "/dashboard/map",
    };

    // Navigate to the new route
    router.push(routeMap[newPage] || "/dashboard");
  };

  return <Dashboard onNavigate={handlePageChange} />;
}
