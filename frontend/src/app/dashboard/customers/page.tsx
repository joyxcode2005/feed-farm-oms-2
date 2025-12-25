"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/config";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users, User, AlertCircle } from "lucide-react";

// Absolute imports for modularity
import CreateCustomerModal from "@/src/components/CreateCustomerModal";

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: "SINGLE" | "DISTRIBUTER";
  state: string | null;
  address: string | null;
}

interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  district: string;
  totalPurchased: number;
  totalPaid: number;
  totalOutstanding: number;
}

export default function CustomersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "ledger">("all");
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");

  // 1. Cached fetch for all customers
  const {
    data: customers = [],
    isLoading: loadingCustomers,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await api.get("/customers");
      return res.data.customers || res.data.data;
    },
    staleTime: 1000 * 60 * 5, // Cache stays fresh for 5 minutes
  });

  // 2. Cached fetch for financial summary (Ledger Tab)
  const {
    data: summaries = [],
    isLoading: loadingSummary,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["customers-financial-summary"],
    queryFn: async () => {
      const res = await api.get("/customers/financial-summary");
      return res.data.data;
    },
    enabled: activeTab === "ledger", // Only fetch when tab is active
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = activeTab === "all" ? loadingCustomers : loadingSummary;

  // Search filtering logic
  const filteredCustomers = customers.filter(
    (c: Customer) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const filteredSummaries = summaries.filter(
    (s: CustomerSummary) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Customers
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your client base, distributors, and farmers.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Tab Navigation System */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            activeTab === "all"
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500"
          }`}
        >
          All Customers
          {activeTab === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            activeTab === "ledger"
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500"
          }`}
        >
          Customer Ledger
          {activeTab === "ledger" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100" />
          )}
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          className="w-full sm:w-80 pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-200 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {activeTab === "all" ? (
        /* Standard Customer Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse"
              ></div>
            ))
          ) : filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer: Customer) => (
              <div
                key={customer.id}
                onClick={() =>
                  router.push(`/dashboard/customers/${customer.id}`)
                }
                className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`p-2 rounded-full ${
                      customer.type === "DISTRIBUTER"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {customer.type === "DISTRIBUTER" ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {customer.name}
                    </h3>
                    <p className="text-xs text-zinc-500">{customer.type}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400 mt-3">
                  <p className="flex items-center gap-2">
                    <span className="font-mono text-zinc-500 text-xs">PH:</span>
                    {customer.phone}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-zinc-500">
              No customers found.
            </div>
          )}
        </div>
      ) : (
        /* Customer Ledger Table View */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-500">
                  Customer Name
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500 text-right">
                  Total Purchased
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500 text-right">
                  Total Paid
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500 text-right">
                  Outstanding
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr className="animate-pulse">
                  <td colSpan={5} className="h-24 bg-zinc-50/50" />
                </tr>
              ) : (
                filteredSummaries.map((item: CustomerSummary) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/customers/${item.id}`)
                    }
                  >
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.name}{" "}
                      <span className="block text-xs font-normal text-zinc-500">
                        {item.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      ₹{item.totalPurchased.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600">
                      ₹{item.totalPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">
                      ₹{item.totalOutstanding.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {item.totalOutstanding > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          <AlertCircle className="w-3 h-3" /> Due
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          Clear
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isCreating && (
        <CreateCustomerModal
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            refetchCustomers(); // Invalidate cache on update
            refetchSummary();
          }}
        />
      )}
    </div>
  );
}
