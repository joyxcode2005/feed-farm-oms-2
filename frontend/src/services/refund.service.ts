
import { api } from "../config";
import { Refund, RefundStatus } from "../types";

export const RefundService = {
  /**
   * Fetches all refund requests, optionally filtered by status (PENDING, APPROVED, REJECTED).
   */
  getAll: async (status?: RefundStatus) => {
    const res = await api.get("/refunds", {
      params: { status },
    });
    return res.data.data as Refund[];
  },

  /**
   * Approves a specific refund request.
   * This will trigger the backend to update order financials and create a negative payment entry.
   */
  approve: async (id: string) => {
    const res = await api.put(`/refunds/${id}/approve`);
    return res.data;
  },

  /**
   * Rejects a specific refund request.
   */
  reject: async (id: string) => {
    const res = await api.put(`/refunds/${id}/reject`);
    return res.data;
  },
};
