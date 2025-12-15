import { Admin } from "../config";
import DetailItem from "../helpers/DetailItem";

export default function SettingsPage({ admin }: { admin: Admin }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold uppercase tracking-wide">
          Settings
        </h2>
        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md">
          Active
        </span>
      </div>

      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        {/* Header Section: Identity */}
        <div className="p-6 border-b dark:border-zinc-800 flex items-center gap-5">
          {/* Avatar Placeholder */}
          <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-500 dark:text-zinc-400">
            {admin.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {admin.name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                {admin.role}
              </span>
            </div>
          </div>
        </div>

        {/* Body Section: Details Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailItem label="Email Address" value={admin.email} />
          <DetailItem label="Phone Number" value={admin.phone} />

          <DetailItem
            label="Admin ID"
            value={admin.id.toString().padStart(6, "0")}
          />
          <DetailItem label="Joined" value={new Date().toLocaleDateString()} />
        </div>
      </div>
    </div>
  );
}
