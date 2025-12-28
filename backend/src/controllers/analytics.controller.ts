import { endOfDay, endOfMonth, endOfYear, startOfDay, startOfMonth, startOfYear } from "date-fns";
import prisma from "../config/prisma";

/**
 * Main dashboard stats fetcher.
 * Period can be 'day', 'month', or 'year'.
 */
export async function getDashboardStatsDB(period: "day" | "month" | "year", date: Date) {
  let startDate: Date;
  let endDate: Date;

  if (period === "day") {
    startDate = startOfDay(date);
    endDate = endOfDay(date);

    // Check if we are looking at "Today"
    const isToday = startDate.toDateString() === new Date().toDateString();

    if (isToday) {
      return getLiveStats(startDate, endDate);
    } else {
      // Fetch from cached DailyReport
      const report = await prisma.dailyReport.findUnique({ where: { date: startDate } });
      return report || getEmptyStats();
    }
  } else if (period === "month") {
    startDate = startOfMonth(date);
    endDate = endOfMonth(date);
  } else {
    startDate = startOfYear(date);
    endDate = endOfYear(date);
  }

  // Aggregate stats from the DailyReport table for Month/Year
  const aggregated = await prisma.dailyReport.aggregate({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    _sum: {
      totalSales: true,
      totalRevenue: true,
      totalExpenses: true,
      totalOrders: true,
      totalProductionKg: true,
      totalBatches: true,
    },
  });

  return {
    totalSales: aggregated._sum.totalSales || 0,
    totalRevenue: aggregated._sum.totalRevenue || 0,
    totalExpenses: aggregated._sum.totalExpenses || 0,
    totalOrders: aggregated._sum.totalOrders || 0,
    totalProductionKg: aggregated._sum.totalProductionKg || 0,
    totalBatches: aggregated._sum.totalBatches || 0,
  };
}

/**
 * Calculates real-time stats for the current day (before the cron runs).
 */
async function getLiveStats(start: Date, end: Date) {
  const [sales, revenue, expenses, production] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: start, lte: end }, NOT: { orderStatus: "CANCELED" } },
      _sum: { finalAmount: true },
      _count: { id: true },
    }),
    prisma.payment.aggregate({
      where: { paymentDate: { gte: start, lte: end } },
      _sum: { amountPaid: true },
    }),
    prisma.expense.aggregate({
      where: { expenseDate: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.productionBatch.aggregate({
      where: { productionDate: { gte: start, lte: end } },
      _sum: { producedKg: true },
      _count: { id: true },
    }),
  ]);

  return {
    totalSales: sales._sum.finalAmount || 0,
    totalRevenue: revenue._sum.amountPaid || 0,
    totalExpenses: expenses._sum.amount || 0,
    totalOrders: sales._count.id || 0,
    totalProductionKg: production._sum.producedKg || 0,
    totalBatches: production._count.id || 0,
  };
}

function getEmptyStats() {
  return {
    totalSales: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    totalOrders: 0,
    totalProductionKg: 0,
    totalBatches: 0,
  };
}
