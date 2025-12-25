/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { forwardRef } from "react";

interface CustomerBillProps {
  customer: any;
  orders: any[];
  summary: {
    totalOrders: number;
    totalPaid: number;
    totalDue: number;
  };
}

export const CustomerBill = forwardRef<HTMLDivElement, CustomerBillProps>(
  ({ customer, orders, summary }, ref) => {
    if (!customer) return null;

    return (
      <div ref={ref} className="p-10 bg-white text-black font-sans print:p-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-zinc-100 pb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              STAR FEED
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-medium">
              Customer Account Statement
            </p>
          </div>
          <div className="text-right">
            <div className="bg-zinc-100 px-3 py-1 rounded text-xs font-bold mb-2 inline-block">
              STATEMENT
            </div>
            <p className="text-sm text-zinc-600">
              Generated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-2">
              Customer Details
            </h3>
            <p className="text-lg font-bold text-zinc-900">{customer.name}</p>
            <p className="text-sm text-zinc-600">{customer.phone}</p>
            <p className="text-sm text-zinc-600">
              {customer.district}, {customer.address || "N/A"}
            </p>
            <p className="text-xs text-zinc-500 mt-1 uppercase font-medium">
              Type: {customer.type}
            </p>
          </div>
          <div className="text-right">
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-2">
              Account Summary
            </h3>
            <div className="space-y-1">
              <p className="text-sm text-zinc-600">
                Total Orders:{" "}
                <span className="font-bold text-zinc-900">
                  {summary.totalOrders}
                </span>
              </p>
              <p className="text-sm text-zinc-600">
                Total Paid:{" "}
                <span className="font-bold text-green-600">
                  ₹{summary.totalPaid.toLocaleString()}
                </span>
              </p>
              <p className="text-sm text-zinc-600">
                Outstanding:{" "}
                <span className="font-bold text-red-600">
                  ₹{summary.totalDue.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <table className="w-full mt-10 text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="py-3 text-[10px] font-bold uppercase text-zinc-400">
                Date
              </th>
              <th className="py-3 text-[10px] font-bold uppercase text-zinc-400">
                Order ID
              </th>
              <th className="py-3 text-[10px] font-bold uppercase text-zinc-400">
                Items
              </th>
              <th className="py-3 text-[10px] font-bold uppercase text-zinc-400 text-right">
                Amount
              </th>
              <th className="py-3 text-[10px] font-bold uppercase text-zinc-400 text-right">
                Paid
              </th>
              <th className="py-3 text-[10px] font-bold uppercase text-zinc-400 text-right">
                Due
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.map((order: any) => (
              <tr key={order.id}>
                <td className="py-4 text-sm text-zinc-600">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="py-4 font-mono text-xs text-zinc-500">
                  #{order.id.slice(-6).toUpperCase()}
                </td>
                <td className="py-4 text-sm text-zinc-600">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="text-xs">
                      {item.feedCategory.name} ({item.quantityBags} bags)
                    </div>
                  )) || "N/A"}
                </td>
                <td className="py-4 text-sm text-zinc-900 text-right font-medium">
                  ₹{order.finalAmount.toLocaleString()}
                </td>
                <td className="py-4 text-sm text-green-600 text-right">
                  ₹{order.paidAmount.toLocaleString()}
                </td>
                <td className="py-4 text-sm text-red-600 text-right font-bold">
                  ₹{order.dueAmount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Section */}
        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-[300px] space-y-3 border-t-2 border-zinc-200 pt-4">
            <div className="flex justify-between text-base font-bold text-zinc-900">
              <span>Total Revenue:</span>
              <span>
                ₹
                {orders
                  .reduce((sum, o) => sum + o.finalAmount, 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-green-600">
              <span>Total Collected:</span>
              <span>
                ₹
                {orders
                  .reduce((sum, o) => sum + o.paidAmount, 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold text-red-600 pt-2 border-t-2 border-zinc-100">
              <span>Outstanding Balance:</span>
              <span>
                ₹
                {orders
                  .reduce((sum, o) => sum + o.dueAmount, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-400 italic">
            This is a computer-generated statement. No signature is required.
          </p>
          <p className="text-[10px] text-zinc-300 mt-2 uppercase tracking-[0.2em]">
            Thank you for your business
          </p>
        </div>
      </div>
    );
  }
);

CustomerBill.displayName = "CustomerBill";