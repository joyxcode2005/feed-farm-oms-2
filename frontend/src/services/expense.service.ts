/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "../config";
import { Expense } from "../types";

export const ExpenseService = {
  getAll: async (params?: any) => {
    const res = await api.get("/expenses", { params });
    return res.data.data as Expense[];
  },
  create: async (data: any) => {
    return await api.post("/expenses", data);
  },
  delete: async (id: string) => {
    return await api.delete(`/expenses/${id}`);
  }
};