import { LogOut } from "lucide-react";
import { Admin } from "../config";

export default function AdminHeader({
  admin,
  onLogout,
}: {
  admin: Admin;
  onLogout: () => void;
}) {
  return (
    <header className="bg-white dark:bg-zinc-900 border-b">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        <h1 className="text-xl font-semibold">STAR FEED</h1>

        <div className="flex items-center gap-4">
          <span className="text-sm">{admin.name}</span>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
