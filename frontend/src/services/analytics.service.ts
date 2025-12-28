import { api } from "../config";
import { DashboardStats } from "../types";

export const AnalyticsService = {
  /**
   * Fetches dashboard statistics for a specific period.
   * @param period - 'day', 'month', or 'year'
   * @param date - The date around which to calculate (e.g., today's date)
   */
  getStats: async (period: "day" | "month" | "year", date: Date) => {
    const res = await api.get("/analytics/stats", {
      params: {
        period,
        date: date.toISOString(),
      },
    });
    return res.data.data as DashboardStats;
  },
};
