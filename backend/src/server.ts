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

dotenv.config();

const PORT = process.env.PORT || 8000;

// Init the express app
const app = express();

// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Health check route
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Server is healthy!!",
  });
});

// Routes
app.use("/api/v1/admin/auth", authRouter);

// Middleware to protect the route
app.use(adminUserMiddleware);

// Other sub routes for the admin
app.use("/api/v1/admin/raw-materials", rawMaterialRouter);
app.use("/api/v1/admin/finished-feed", finishedFeedRouter);
app.use("/api/v1/admin/customers", customersRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
