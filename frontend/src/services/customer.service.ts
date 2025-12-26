import { api } from "../config";
import { Customer, CustomerSummary } from "../types";

export const CustomerService = {
  getAll: async () => {
    const res = await api.get("/customers");
    return (res.data.customers || res.data.data) as Customer[];
  },
  getFinancialSummary: async () => {
    const res = await api.get("/customers/financial-summary");
    return res.data.data as CustomerSummary[];
  },
  create: async (payload: Partial<Customer>) => {
    return await api.post("/customers", payload);
  },
};
