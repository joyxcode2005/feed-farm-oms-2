import { SidebarPageType } from "@/src/config";
import { sidebarItems } from "@/src/helpers/sidebarItems";

export default function Sidebar({
  items,
  activePage,
  onChange,
}: {
  items: typeof sidebarItems;
  activePage: SidebarPageType;
  onChange: (page: SidebarPageType) => void;
}) {
  return (
    <aside className="w-64 border-r bg-white dark:bg-zinc-900 min-h-screen">
      <nav className="p-4 space-y-2">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer ${
              activePage === item.key
                ? "bg-zinc-900 text-white"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
