import {
  Factory,
  LayoutDashboard,
  Map,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  UserCircle,
  Users,
} from "lucide-react";
import { SidebarPageType } from "../config";

export interface SidebarItem {
  key: SidebarPageType;
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const sidebarItems: SidebarItem[] = [
  {
    key: "Dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    key: "Raw Material Stock",
    label: "Raw Material Stock",
    href: "/dashboard/raw-materials",
    icon: <Package size={18} />,
  },
  {
    key: "Finished Feed Stock",
    label: "Finished Feed Stock",
    href: "/dashboard/finished-feed",
    icon: <Factory size={18} />,
  },
  {
    key: "Orders",
    label: "Orders",
    href: "/dashboard/orders",
    icon: <ShoppingCart size={18} />,
  },
  {
    key: "Customers",
    label: "Customers",
    href: "/dashboard/customers",
    icon: <UserCircle size={18} />,
  },
  {
    key: "Expenses",
    label: "Expenses",
    href: "/dashboard/expenses",
    icon: <ReceiptText size={18} />,
  },
  {
    key: "Admins",
    label: "Admins",
    href: "/dashboard/admins",
    icon: <Users size={18} />,
  },
  {
    key: "Settings",
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings size={18} />,
  },
  {
    key: "Map",
    label: "Map",
    href: "/dashboard/map",
    icon: <Map size={18} />,
  },
];
