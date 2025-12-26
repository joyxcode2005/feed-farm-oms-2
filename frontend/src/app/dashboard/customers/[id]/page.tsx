 /* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/config";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Package,
  Clock,
  IndianRupee,
  Phone,
  MapPin,
  User,
  Users,
  Building,
  Printer,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import { CustomerBill } from "@/src/components/CustomerBill";

// --- Types ---
interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  type: "SINGLE" | "DISTRIBUTER";
  district: string;
}

interface Order {
  id: string;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  createdAt: string;
  items?: {
    id: string;
    quantityBags: number;
    subtotal: number;
    feedCategory: { name: string };
  }[];
}

interface LedgerData {
  summary: {
    totalOrders: number;
    totalPaid: number;
    totalDue: number;
  };
  orders: Order[];
}

interface DetailData {
  customer: CustomerProfile;
  ledger: LedgerData | null;
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: customerId } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);

  const { data, isError, isLoading } = useQuery<DetailData>({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      // Calling both endpoints concurrently
      const [profileRes, ledgerRes] = await Promise.all([
        api.get(`/customers/${customerId}`),
        api.get(`/customers/${customerId}/ledger`),
      ]);

      return {
        customer: (profileRes.data.data || profileRes.data) as CustomerProfile,
        ledger: (ledgerRes.data.data || ledgerRes.data) as LedgerData,
      };
    },
    /**
     * Using placeholderData instead of initialData.
     * This allows us to show the basic info from the list view while
     * FORCING a background fetch for the full profile and ledger immediately.
     */
    placeholderData: () => {
      const allCustomers = queryClient.getQueryData<any[]>(["customers"]);
      const cached = allCustomers?.find((c) => c.id === customerId);

      if (cached) {
        return {
          customer: {
            id: cached.id,
            name: cached.name,
            phone: cached.phone,
            type: cached.type,
            address: cached.address || null,
            district: cached.district || "",
          },
          ledger: null, 
        };
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    enabled: !!customerId,
  });

  const customer = data?.customer;
  const ledger = data?.ledger;

  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: `Customer_Statement_${
      customer?.name
    }_${new Date().toLocaleDateString()}`,
  });

  const handlePrint = () => {
    if (!customer || !ledger) {
      toast.error("Data not fully loaded");
      return;
    }
    setTimeout(() => reactToPrintFn(), 100);
  };

  // Only show full loader if we have NO data (not even placeholder)
  if (isLoading && !customer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Customer not found or failed to load.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/customers")}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Customers
        </button>

        <button
          onClick={handlePrint}
          disabled={!ledger}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print Statement
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-4 rounded-full ${
                customer.type === "DISTRIBUTER"
                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
              }`}
            >
              {customer.type === "DISTRIBUTER" ? (
                <Users className="w-6 h-6" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {customer.name}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-zinc-500">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {customer.phone}
                </p>
                <p className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-medium">
                  {customer.type}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800 pt-4 md:pt-0 md:pl-6">
            <p className="flex items-center gap-2">
              <Building className="w-4 h-4 text-zinc-400" />
              <span className="font-semibold uppercase text-[10px] tracking-wider text-zinc-400">
                District:
              </span>{" "}
              {customer.district || "N/A"}
            </p>
            {customer.address && (
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-zinc-400 mt-0.5" />
                <span className="max-w-[250px]">{customer.address}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {!ledger ? (
        /* Financial Skeleton - Shows while ledger route is fetching */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                <Package className="w-4 h-4" /> Total Orders
              </p>
              <p className="text-3xl font-bold mt-2">
                {ledger.summary.totalOrders}
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-green-600 flex items-center gap-2">
                <IndianRupee className="w-4 h-4" /> Total Paid
              </p>
              <p className="text-3xl font-bold mt-2 text-green-600">
                ₹{ledger.summary.totalPaid.toLocaleString()}
              </p>
            </div>
            <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-red-600 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Total Due
              </p>
              <p className="text-3xl font-bold mt-2 text-red-600">
                ₹{ledger.summary.totalDue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                Order Dues History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right text-green-600">
                      Paid
                    </th>
                    <th className="px-6 py-4 text-right text-red-600">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {ledger.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        #{order.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium">
                        ₹{order.finalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600">
                        ₹{order.paidAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-red-600">
                        ₹{order.dueAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hidden Print Component */}
          <div className="hidden">
            <CustomerBill
              ref={contentRef}
              customer={customer}
              orders={ledger.orders}
              summary={ledger.summary}
            />
          </div>
        </>
      )}
    </div>
  );
}