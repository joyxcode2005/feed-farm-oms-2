/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "../config";
import { Order } from "../types";

export const OrderService = {
  getAll: async () => {
    const res = await api.get("/orders");
    return res.data.data as Order[];
  },

  updateStatus: async (id: string, status: string) => {
    return await api.put(`/orders/${id}/status`, { status });
  },

  create: async (payload: any) => {
    return await api.post("/orders", payload);
  },

  getSummery: async (params: { from: string; to: string }) => {
    const res = await api.get("/orders/summery", { params });
    return res.data;
  },
};
