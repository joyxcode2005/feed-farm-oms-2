import dotenv from "dotenv";
import cors from "cors";
import express, { Request, Response } from "express";
import { corsOptions } from "./config";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import customersRouter from "./routes/customer.routes";
import rawMaterialRouter from "./routes/rawMaterial.routes";
import finishedFeedRouter from "./routes/finishedFeed.routes";
import { adminUserMiddleware } from "./middlewares/auth.middleware";
import animaltypesRouter from "./routes/animalType.routes";
import feedcategoryRouter from "./routes/feedCategory.routes";
import orderRouter from "./routes/order.routes";
import paymentsRouter from "./routes/payments.routes";
import { initCronJobs } from "./config/cron";

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

// Initialize Cron Jobs
initCronJobs();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.get("/", (req: Request, res: Response) => {
  res.json({ success: true, message: "Server is healthy!!" });
});

app.use("/api/v1/admin/auth", authRouter);
app.use(adminUserMiddleware);

app.use("/api/v1/admin/raw-materials", rawMaterialRouter);
app.use("/api/v1/admin/finished-feed", finishedFeedRouter);
app.use("/api/v1/admin/customers", customersRouter);
app.use("/api/v1/admin/animal-types", animaltypesRouter);
app.use("/api/v1/admin/feed-categories", feedcategoryRouter);
app.use("/api/v1/admin/orders", orderRouter);
app.use("/api/v1/admin/payments", paymentsRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});