import cron from "node-cron";
import { generateDailySnapshots } from "../services/snapshot.service";
import { scheduleTime } from ".";

export function initCronJobs() {
  // Run every night at 23:59
  cron.schedule(scheduleTime, async () => {
    try {
      await generateDailySnapshots();
    } catch (error) {
      console.error("Cron Job Error:", error);
    }
  });
}