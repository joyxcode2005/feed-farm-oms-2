/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { forwardRef } from "react";

interface OrderBillProps {
  order: any;
}

export const OrderBill = forwardRef<HTMLDivElement, OrderBillProps>(({ order }, ref) => {
  if (!order) return null;

  return (
    <div ref={ref} className="p-10 bg-white text-black font-sans print:p-8">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-zinc-100 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">FEED FARM</h1>
          <p className="text-sm text-zinc-500 mt-1 font-medium">Order Management System</p>
        </div>
        <div className="text-right">
          <div className="bg-zinc-100 px-3 py-1 rounded text-xs font-bold mb-2 inline-block">INVOICE</div>
          <p className="text-sm font-mono text-zinc-600">#{order.id.toUpperCase()}</p>
          <p className="text-sm text-zinc-600">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-2">Bill To</h3>
          <p className="text-lg font-bold text-zinc-900">{order.customer.name}</p>
          <p className="text-sm text-zinc-600">{order.customer.phone}</p>
          {order.customer.address && <p className="text-sm text-zinc-600 mt-1">{order.customer.address}</p>}
        </div>
        <div className="text-right">
          <h3 className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-2">Order Status</h3>
          <p className="text-sm font-bold text-zinc-900 uppercase tracking-wide">{order.orderStatus}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mt-10 text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="py-3 text-[10px] font-bold uppercase text-zinc-400">Item Description</th>
            <th className="py-3 text-[10px] font-bold uppercase text-zinc-400 text-center">Quantity</th>
            <th className="py-3 text-[10px] font-bold uppercase text-zinc-400 text-right">Price/Bag</th>
            <th className="py-3 text-[10px] font-bold uppercase text-zinc-400 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {order.items?.map((item: any) => (
            <tr key={item.id}>
              <td className="py-4 text-sm font-medium text-zinc-900">{item.feedCategory.name}</td>
              <td className="py-4 text-sm text-zinc-600 text-center">{item.quantityBags} Bags</td>
              <td className="py-4 text-sm text-zinc-600 text-right">₹{(item.subtotal / item.quantityBags).toFixed(2)}</td>
              <td className="py-4 text-sm font-bold text-zinc-900 text-right">₹{item.subtotal}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="mt-8 flex justify-end">
        <div className="w-full max-w-[250px] space-y-3">
          <div className="flex justify-between text-sm text-zinc-600">
            <span>Subtotal:</span>
            <span>₹{order.totalAmount}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-zinc-900 pt-3 border-t border-zinc-200">
            <span>Final Amount:</span>
            <span>₹{order.finalAmount || order.totalAmount}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600 font-medium">
            <span>Paid Amount:</span>
            <span>- ₹{order.paidAmount}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-red-600 pt-2 border-t-2 border-zinc-100">
            <span>Due Balance:</span>
            <span>₹{order.dueAmount}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t border-zinc-100 text-center">
        <p className="text-xs text-zinc-400 italic">This is a computer-generated document. No signature is required.</p>
        <p className="text-[10px] text-zinc-300 mt-2 uppercase tracking-[0.2em]">Thank you for your business</p>
      </div>
    </div>
  );
});

OrderBill.displayName = "OrderBill";