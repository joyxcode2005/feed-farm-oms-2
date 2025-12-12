import { Request, Response, Router } from "express";
import { adminLoginSchema } from "../config/types";
import { existingAdminUser, getAdminUserData } from "../controllers/auth.controller";
import { adminUserMiddleware } from "../middlewares/auth.middleware";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "";

// Route for admin login
router.post("/login", async (req: Request, res: Response) => {
  // Safely parse the body data using zod schema
  const { success, error, data } = adminLoginSchema.safeParse(req.body);

  // Return proper error msg if input data is incorrect
  if (!success) {
    return res.status(401).json({
      success: false,
      message: "Invalid Input!!",
      error: error.message,
    });
  }

  try {
    // Destructure the data from zod data
    const { email, password } = data;

    // Check if admin user already exists
    const existingAdminuser = await existingAdminUser(email);

    // Send appropirate msg if the admin is not registerd
    if (!existingAdminuser)
      return res.status(404).json({
        success: false,
        message:
          "Admin User is not registered!!! Contact the developer to get registered as an admin!!",
      });

    // Check if the password is correct or not
    const comparePassword = await bcrypt.compare(password, existingAdminuser.passwordHash);

    if (!comparePassword)
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials!! Either email or password is incorrect!!",
      });

    const admin_token = jwt.sign(
      {
        id: existingAdminuser.id,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    if (!admin_token)
      return res.status(400).json({
        success: false,
        message: "Vaild to generate authentication token!! Please login again!!",
      });

    res.cookie("admin_token", admin_token, {
      httpOnly: true, // prevents JS access (XSS protection)
      secure: process.env.NODE_ENV === "production", // true over HTTPS
      sameSite: "strict", // prevents CSRF via cross-site requests
      maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
      path: "/", // cookie is valid for the entire site
    });

    return res.status(200).json({
      success: true,
      message: "Login Successfull!!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

router.use(adminUserMiddleware);

// Get admin user details
router.get("/info", async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;

    if (!adminId)
      return res.status(401).json({
        success: false,
        message: "Unauthorized!!",
      });

    const adminInfo = await getAdminUserData(adminId);

    if (!adminInfo)
      return res.status(404).json({
        success: false,
        message: "Admin User Not found!!",
      });

    return res.status(201).json({
      success: true,
      message: "Admin User Data found!!",
      admin: adminInfo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

export default router;
