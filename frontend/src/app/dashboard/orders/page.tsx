/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { Plus, Search, Banknote, Printer } from "lucide-react";
import CreateOrderModal from "@/src/components/CreateOrderModal";
import CreatePaymentModal from "@/src/components/CreatePaymentModal";
import { useReactToPrint } from "react-to-print";
import { OrderBill } from "@/src/components/OrderBill";

interface Order {
  id: string;
  orderStatus: string;
  totalAmount: number;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  deliveryDate: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    address?: string;
  };
  items: {
    id: string;
    quantityBags: number;
    subtotal: number;
    feedCategory: {
      name: string;
    };
  }[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Modal & Print States
  const [isCreating, setIsCreating] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);

  // Hook to handle browser print dialog
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: `Bill_${printOrder?.id.slice(0, 8)}`,
  });

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Function called when user clicks the Printer icon
  const handlePrint = (order: Order) => {
    setPrintOrder(order);
    // Small timeout ensures the print component is populated before dialog opens
    setTimeout(() => {
      reactToPrintFn();
    }, 100);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      toast.success("Status updated");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "CONFIRMED": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "DISPATCHED": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "DELIVERED": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "CANCELED": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-zinc-100 text-zinc-700";
    }
  };

  const filteredOrders = orders.filter(order => 
    (statusFilter === "" || order.orderStatus === statusFilter) &&
    (order.customer.name.toLowerCase().includes(search.toLowerCase()) || 
     order.id.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Orders</h2>
          <p className="text-sm text-zinc-500 mt-1">Manage customer orders and deliveries.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium rounded-lg hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text"
            placeholder="Search customer or Order ID..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-200 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELED">Canceled</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-500">Order ID</th>
                <th className="px-6 py-4 font-medium text-zinc-500">Customer</th>
                <th className="px-6 py-4 font-medium text-zinc-500">Date</th>
                <th className="px-6 py-4 font-medium text-zinc-500">Status</th>
                <th className="px-6 py-4 font-medium text-zinc-500">Payment</th>
                <th className="px-6 py-4 font-medium text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="h-16 animate-pulse bg-zinc-50"><td colSpan={6}/></tr>)
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">#{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{order.customer.name}</p>
                    <p className="text-xs text-zinc-500">{order.customer.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      className={`px-2 py-1 rounded text-xs font-semibold border-none outline-none cursor-pointer ${getStatusColor(order.orderStatus)}`}
                      value={order.orderStatus}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="DISPATCHED">DISPATCHED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELED">CANCELED</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs w-28 text-zinc-500">
                        <span>Final:</span>
                        <span className="font-medium">₹{order.finalAmount}</span>
                      </div>
                      <div className="flex justify-between text-xs w-28 text-red-600">
                        <span>Due:</span>
                        <span className="font-medium">₹{order.dueAmount}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* NEW: Print Bill Button */}
                      <button 
                        onClick={() => handlePrint(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 rounded-md text-xs font-medium transition-colors border border-zinc-200"
                        title="Print Bill"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      
                      {order.dueAmount > 0 && order.orderStatus !== 'CANCELED' && (
                        <button 
                          onClick={() => setPaymentOrder(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md text-xs font-medium transition-colors"
                        >
                          <Banknote className="w-3 h-3" /> Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Component for Printing - Only accessible via contentRef */}
      <div className="hidden">
        <OrderBill ref={contentRef} order={printOrder} />
      </div>

      {/* Modals */}
      {isCreating && (
        <CreateOrderModal 
          onClose={() => setIsCreating(false)} 
          onCreated={() => { setIsCreating(false); fetchOrders(); }} 
        />
      )}
      {paymentOrder && (
        <CreatePaymentModal
          order={{ 
            id: paymentOrder.id, 
            customerName: paymentOrder.customer.name, 
            dueAmount: paymentOrder.dueAmount 
          }}
          onClose={() => setPaymentOrder(null)}
          onSuccess={() => { setPaymentOrder(null); fetchOrders(); }}
        />
      )}
    </div>
  );
}