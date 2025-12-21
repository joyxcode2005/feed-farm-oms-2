"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarItems } from "@/src/helpers/sidebarItems";

export default function Sidebar() {
  // Get the current pathname
  const pathname = usePathname() || "";

  return (
    <aside className="w-64 border-r bg-white dark:bg-zinc-900 min-h-screen sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => {
          // FIX: If the item is the main dashboard, only highlight if it's an exact match.
          // Otherwise, check if the current path starts with the item's href.
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          {
            console.log("Sidebar item:", item.label, "isActive:", isActive);
          }
          return (
            // Render each sidebar item as a Link
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
