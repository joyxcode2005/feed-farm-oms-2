import { Request, Response, Router } from "express";
import { adminUserMiddleware } from "../middlewares/auth.middleware";
import { adminLoginSchema, adminUpdateSchema, createNewAdminSchema } from "../config/types";
import {
  deleteAdminUser,
  createNewAdminUser,
  findAdminUser,
  getAllAdminUsers,
  updateAdminUserData,
} from "../controllers/auth.controller";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "";

/**
 * PUBLIC ROUTES
 */

// Route for admin login
router.post("/login", async (req: Request, res: Response) => {
  const { success, error, data } = adminLoginSchema.safeParse(req.body);

  if (!success) {
    return res.status(401).json({
      success: false,
      message: "Invalid Input!!",
      error: error.message,
    });
  }

  try {
    const { email, password } = data;
    const existingAdminuser = await findAdminUser(email);

    if (!existingAdminuser)
      return res.status(404).json({
        success: false,
        message: "Admin User is not registered!!! Contact the developer to get registered as an admin!!",
      });

    const comparePassword = await bcrypt.compare(password, existingAdminuser.passwordHash);

    if (!comparePassword)
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials!! Either email or password is incorrect!!",
      });

    const admin_token = jwt.sign(
      { id: existingAdminuser.id },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    if (!admin_token)
      return res.status(400).json({
        success: false,
        message: "Failed to generate authentication token!! Please login again!!",
      });

    res.cookie("admin_token", admin_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
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

// Route to logout
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("admin_token", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return res.status(200).json({ success: true, message: "Admin Logged Out Successfully!" });
});

/**
 * PROTECTED ROUTES (Requires adminUserMiddleware)
 */
router.use(adminUserMiddleware);

// Get logged-in admin details
router.get("/info", async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    if (!adminId) return res.status(401).json({ success: false, message: "Unauthorized!!" });

    const adminInfo = await findAdminUser(adminId);
    if (!adminInfo) return res.status(404).json({ success: false, message: "Admin User Not found!!" });

    return res.status(200).json({
      success: true,
      message: "Admin User Data found!!",
      admin: adminInfo,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error!!" });
  }
});

// Update OWN data (the logged-in admin)
router.put("/update", async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const { success, error, data } = adminUpdateSchema.safeParse(req.body);

    if (!success) return res.status(401).json({ success: false, message: "Invalid Input!!", error: error.message });

    const { name, phone, email } = data;
    const updatedAdminData = await updateAdminUserData(adminId, name, email, phone);

    if (!updatedAdminData) return res.status(402).json({ success: false, message: "Failed to update admin details!!" });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!!",
      updatedAdminData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error!!" });
  }
});

// Route to get all admins (Except self)
router.get("/all", async (req: Request, res: Response) => {
  const adminId = (req as any).adminId;
  try {
    const adminUsers = await getAllAdminUsers(adminId);
    if (!adminUsers) return res.status(404).json({ success: false, message: "No admin users found!!" });

    return res.status(200).json({
      success: true,
      message: "Admin Users data fetched!!",
      adminUsers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error!!" });
  }
});

/**
 * SUPER_ADMIN ONLY ROUTES
 */

// Route to update ANOTHER admin's details (Required for EditModal connection)
router.put("/update-admin/:id", async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const targetId = req.params.id;

    // 1. Verify requester is a SUPER_ADMIN
    const loggedInAdmin = await findAdminUser(adminId);
    if (loggedInAdmin?.role !== "SUPER_ADMIN") {
      return res.status(401).json({ success: false, message: "Unauthorized!! Only Super Admins can perform this action." });
    }

    // 2. Parse input data
    const { success, error, data } = adminUpdateSchema.safeParse(req.body);
    if (!success) return res.status(400).json({ success: false, message: "Invalid Input!!", error: error.message });

    const { name, email, phone } = data;

    // 3. Perform update on the target admin ID
    const updatedAdminData = await updateAdminUserData(targetId, name, email, phone);

    if (!updatedAdminData) {
      return res.status(404).json({ success: false, message: "Target Admin user not found!!" });
    }

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully!!",
      updatedAdminData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error!!" });
  }
});

// Delete an admin (Only SUPER_ADMIN can delete an ADMIN)
router.delete("/delete/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const adminId = (req as any).adminId;

  if (!id || !adminId) return res.status(404).json({ success: false, message: "Missing ID or Unauthorized!!" });

  const existingAdmin = await findAdminUser(adminId);
  const existingAdminToDelete = await findAdminUser(id);

  if (existingAdmin?.role === "SUPER_ADMIN" && existingAdminToDelete?.role === "ADMIN") {
    try {
      const deletedAdminUser = await deleteAdminUser(id);
      if (!deletedAdminUser) return res.status(400).json({ success: false, message: "Failed to delete Admin User!!" });

      return res.status(200).json({
        success: true,
        message: "Admin User Deleted successfully!!",
        deletedAdminUser,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal Server Error!!!" });
    }
  } else {
    return res.status(401).json({ success: false, message: "Unauthorized!! Cannot delete a Super Admin or self." });
  }
});

// Create new admin (Only SUPER_ADMIN)
router.post("/create-admin", async (req: Request, res: Response) => {
  try {
    const { success, error, data } = createNewAdminSchema.safeParse(req.body);
    const adminId = (req as any).adminId;

    if (!success) return res.status(401).json({ success: false, message: "Invalid Input!!", error: error.flatten() });

    const loggedInAdminUser = await findAdminUser(adminId);
    if (!loggedInAdminUser || loggedInAdminUser.role !== "SUPER_ADMIN") {
      return res.status(401).json({ success: false, message: "Unauthorized!!" });
    }

    const { name, email, phone, password } = data;

    // Check uniqueness (you can add email check here as well)
    const existingAdminUserWithSamePhone = await findAdminUser(phone);
    if (existingAdminUserWithSamePhone) return res.status(401).json({ success: false, message: "Admin user with the same phone already exists!!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdminUser = await createNewAdminUser(name, email, phone, hashedPassword, "ADMIN");

    if (!newAdminUser) return res.status(402).json({ success: false, message: "Failed to create admin user!!" });

    return res.status(202).json({
      success: true,
      message: "New Admin created successfully!!",
      newAdminUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error!!" });
  }
});

export default router;