"use client";

import { useEffect, useState } from "react";

import {
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCcw,
} from "lucide-react";

import { toast } from "react-hot-toast";
import { RefundService } from "@/src/services/refund.service";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { Refund, RefundStatus } from "@/src/types";

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RefundStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const data = await RefundService.getAll(
        filter === "ALL" ? undefined : filter
      );
      setRefunds(data);
    } catch (error) {
      toast.error("Failed to fetch refund requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [filter]);

  const handleApprove = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to approve this refund? This will update the company's financial ledger."
      )
    )
      return;

    try {
      await RefundService.approve(id);
      toast.success("Refund approved successfully");
      fetchRefunds();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Approval failed");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this refund request?")) return;

    try {
      await RefundService.reject(id);
      toast.success("Refund request rejected");
      fetchRefunds();
    } catch (error: any) {
      console.error("Rejection failed:", error);
      toast.error("Rejection failed");
    }
  };

  const filteredRefunds = refunds.filter(
    (r) =>
      r.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orderId.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Refund Management
          </h1>
          <p className="text-gray-500">
            Review and process customer refund requests
          </p>
        </div>

        <button
          onClick={fetchRefunds}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by customer or order ID..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-4 h-4" />
          <select
            className="w-full p-2 border rounded-lg outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                Customer
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                Order ID
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                Amount
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                Status
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  Loading refunds...
                </td>
              </tr>
            ) : filteredRefunds.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No refund requests found
                </td>
              </tr>
            ) : (
              filteredRefunds.map((refund) => (
                <tr
                  key={refund.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {refund.customer.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {refund.customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    #{refund.orderId.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-blue-600">
                    ₹{refund.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={refund.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {refund.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(refund.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve Refund"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReject(refund.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject Refund"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        Processed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
