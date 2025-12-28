import { Request, Response, Router } from "express";
import { getDashboardStatsDB } from "../controllers/analytics.controller";

const router = Router();
/**
 * Route to get dashboard analytics
 * Query params:
 * - period: 'day' | 'month' | 'year'
 * - date: ISO date string
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const { period, date } = req.query;

    if (!period || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters: period and date",
      });
    }

    const stats = await getDashboardStatsDB(
      period as "day" | "month" | "year",
      new Date(date as string),
    );

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Fetching dashboard stats failed:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

export default router;
