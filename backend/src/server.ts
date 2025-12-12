import dotenv from "dotenv";
import cors from "cors";
import express, { Request, Response } from "express";
import { corsOptions } from "./config";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.router";

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

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
