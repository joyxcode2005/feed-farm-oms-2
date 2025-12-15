import React from "react";
import { SidebarPageType } from "../config";
import {
  Factory,
  LayoutDashboard,
  Map,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";

export const sidebarItems: {
  key: SidebarPageType;
  label: SidebarPageType;
  icon: React.ReactNode;
}[] = [
  {
    key: "Dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={16} />,
  },
  {
    key: "Raw Material Stock",
    label: "Raw Material Stock",
    icon: <Package size={16} />,
  },
  {
    key: "Finished Feed Stock",
    label: "Finished Feed Stock",
    icon: <Factory size={16} />,
  },
  {
    key: "Orders",
    label: "Orders",
    icon: <ShoppingCart size={16} />,
  },
  {
    key: "Admins",
    label: "Admins",
    icon: <Users size={16} />,
  },
  {
    key: "Settings",
    label: "Settings",
    icon: <Settings size={16} />,
  },
  {
    key: "Map",
    label: "Map",
    icon: <Map size={16} />,
  },
];
