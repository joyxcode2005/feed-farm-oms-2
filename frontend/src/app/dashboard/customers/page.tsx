"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users, User, AlertCircle, Printer, Loader2 } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import toast from "react-hot-toast";

import { api } from "@/src/config";
import { CustomerService } from "@/src/services/customer.service";
import { Customer, CustomerSummary } from "@/src/types";
import CreateCustomerModal from "@/src/components/CreateCustomerModal";
import { CustomerBill } from "@/src/components/CustomerBill";

export default function CustomersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "ledger">("all");
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");
  
  // Printing State
  const printRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<{customer: any, orders: any[], summary: any} | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  // 1. Fetch Customers
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: CustomerService.getAll,
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch Financial Ledger Summary
  const { data: summaries = [], isLoading: loadingSummary } = useQuery({
    queryKey: ["customers-financial-summary"],
    queryFn: CustomerService.getFinancialSummary,
    enabled: activeTab === "ledger",
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = activeTab === "all" ? loadingCustomers : loadingSummary;

  // Print Functionality
  const reactToPrintFn = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Customer_Bill_${printData?.customer?.name || 'Statement'}`,
  });

  const handleRowPrint = async (e: React.MouseEvent, customerId: string) => {
    e.stopPropagation(); // Prevent navigating to detail page
    setPrintingId(customerId);

    try {
      // Fetch full details for this specific customer on demand
      const [custRes, ledgerRes] = await Promise.all([
        api.get(`/customers/${customerId}`),
        api.get(`/customers/${customerId}/ledger`)
      ]);

      setPrintData({
        customer: custRes.data.data,
        orders: ledgerRes.data.data.orders,
        summary: ledgerRes.data.data.summary
      });

      // Allow React to render the hidden bill before printing
      setTimeout(() => {
        reactToPrintFn();
        setPrintingId(null);
      }, 100);

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate bill");
      setPrintingId(null);
    }
  };

  // Filtering Logic
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
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium rounded-lg hover:opacity-90 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            activeTab === "all"
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
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
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          }`}
        >
          Customer Ledger
          {activeTab === "ledger" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100" />
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          className="w-full sm:w-80 pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800 outline-none placeholder:text-zinc-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {activeTab === "all" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"
              />
            ))
          ) : filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
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
                        ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
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
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                      {customer.type}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400 mt-3">
                  <p className="flex items-center gap-2">
                    <span className="font-mono text-zinc-500 dark:text-zinc-500 text-xs">PH:</span>{" "}
                    {customer.phone}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-zinc-500 dark:text-zinc-400">
              No customers found.
            </div>
          )}
        </div>
      ) : (
        // --- LEDGER TAB: Updated Columns & Print Button ---
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400">
                  Customer Name
                </th>
                {/* REMOVED TOTAL PURCHASED COLUMN */}
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 text-right">
                  Total Paid
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 text-right">
                  Outstanding
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr className="animate-pulse">
                  <td colSpan={5} className="h-24 bg-zinc-50/50 dark:bg-zinc-800/30" />
                </tr>
              ) : (
                filteredSummaries.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(`/dashboard/customers/${item.id}`)
                    }
                  >
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.name}{" "}
                      <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        {item.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      ₹{item.totalPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-600 dark:text-red-400">
                      ₹{item.totalOutstanding.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {item.totalOutstanding > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30 px-2 py-1 rounded">
                          <AlertCircle className="w-3 h-3" /> Due
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30 px-2 py-1 rounded">
                          Clear
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => handleRowPrint(e, item.id)}
                        disabled={printingId === item.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {printingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Printer className="w-3.5 h-3.5" />
                        )}
                        Print Bill
                      </button>
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
            router.refresh();
          }}
        />
      )}

      {/* Hidden component for printing */}
      <div className="hidden">
        {printData && (
          <CustomerBill
            ref={printRef}
            customer={printData.customer}
            orders={printData.orders}
            summary={printData.summary}
          />
        )}
      </div>
    </div>
  );
}