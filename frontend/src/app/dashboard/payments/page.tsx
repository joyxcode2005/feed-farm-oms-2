"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { Search, CreditCard, Banknote, ShieldCheck } from "lucide-react";

// Interface based on the API data structure
interface Payment {
  id: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: "CASH" | "CREDIT" | "ONLINE" | "UPI" | "BANK" | "OTHER";
  note: string | null;
  adminUser: {
    name: string;
    id: string;
  } | null;
  order: {
    id: string;
    finalAmount: number;
    dueAmount: number;
    customer: {
      name: string;
      id: string;
      phone: string;
    };
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPayments = async () => {
    try {
      const res = await api.get("/payments");
      setPayments(res.data.data);
    } catch (error) {
      console.error("Failed to load payments.", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter payments by customer name or order ID
  const filteredPayments = payments.filter(
    (payment) =>
      payment.order.customer.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      payment.order.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Payments
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Transaction history and financial records.
        </p>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search customer or order ref..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-500">Date</th>
                <th className="px-6 py-4 font-medium text-zinc-500">
                  Customer
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500">
                  Order Ref
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500">
                  Collected By
                </th>
                <th className="px-6 py-4 font-medium text-zinc-500">Method</th>
                <th className="px-6 py-4 font-medium text-zinc-500">Amount</th>
                <th className="px-6 py-4 font-medium text-zinc-500">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr
                    key={i}
                    className="h-12 animate-pulse bg-zinc-50 dark:bg-zinc-800/50"
                  >
                    <td colSpan={7} />
                  </tr>
                ))
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {payment.order.customer.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {payment.order.customer.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                      #{payment.order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      {payment.adminUser ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                          <ShieldCheck className="w-3 h-3" />
                          {payment.adminUser.name}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {payment.paymentMethod === "CASH" ? (
                          <Banknote className="w-3 h-3" />
                        ) : (
                          <CreditCard className="w-3 h-3" />
                        )}
                        {payment.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-600">
                      + ₹{payment.amountPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 italic text-xs">
                      {payment.note || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
