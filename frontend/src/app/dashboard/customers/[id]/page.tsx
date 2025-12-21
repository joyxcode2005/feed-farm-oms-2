/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/config";
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  IndianRupee, 
  Phone, 
  MapPin, 
  User, 
  Users,
  Building
} from "lucide-react";
import toast from "react-hot-toast";

// Define shapes based on your backend controllers
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
}

interface LedgerData {
  summary: {
    totalOrders: number;
    totalPaid: number;
    totalDue: number;
  };
  orders: Order[];
}

export default function CustomerDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: customerId } = React.use(params);
  const router = useRouter();
  
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both profile and ledger in parallel
        const [profileRes, ledgerRes] = await Promise.all([
          api.get(`/customers/${customerId}`),
          api.get(`/customers/${customerId}/ledger`)
        ]);

        setCustomer(profileRes.data.data || profileRes.data);
        setLedger(ledgerRes.data.data || ledgerRes.data);
      } catch (error) {
        toast.error("Failed to load customer details");
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) fetchData();
  }, [customerId]);

  if (isLoading) return <div className="p-8 text-center animate-pulse text-zinc-500">Loading details...</div>;
  if (!customer || !ledger) return <div className="p-8 text-center">Customer not found.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Navigation */}
      <button 
        onClick={() => router.push('/dashboard/customers')} 
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors group mb-2"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
        Back to Customers
      </button>

      {/* Customer Profile Header Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-full ${customer.type === "DISTRIBUTER" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
              {customer.type === "DISTRIBUTER" ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{customer.name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-zinc-500">
                <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {customer.phone}</p>
                <p className="flex items-center gap-1.5 font-medium px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">
                  {customer.type}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800 pt-4 md:pt-0 md:pl-6">
            <p className="flex items-center gap-2">
              <Building className="w-4 h-4 text-zinc-400" />
              <span className="font-semibold uppercase text-[10px] tracking-wider text-zinc-400">District:</span> {customer.district}
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

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-zinc-500 flex items-center gap-2"><Package className="w-4 h-4" /> Total Orders</p>
          <p className="text-3xl font-bold mt-2">{ledger.summary.totalOrders}</p>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-green-600 flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Total Paid</p>
          <p className="text-3xl font-bold mt-2 text-green-600">₹{ledger.summary.totalPaid.toLocaleString()}</p>
        </div>

        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-red-600 flex items-center gap-2"><Clock className="w-4 h-4" /> Total Due</p>
          <p className="text-3xl font-bold mt-2 text-red-600">₹{ledger.summary.totalDue.toLocaleString()}</p>
        </div>
      </div>

      {/* Dues Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Order Dues History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right text-green-600">Paid</th>
                <th className="px-6 py-4 text-right text-red-600">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {ledger.orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">#{order.id.slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">₹{order.finalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right text-green-600">₹{order.paidAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-red-600">
                    ₹{order.dueAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}