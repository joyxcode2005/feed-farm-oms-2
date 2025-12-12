import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export async function adminUserMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get the admin token from the cookie!!
    const admin_token = req.cookies?.admin_token;

    // If no token, then return proper msg
    if (!admin_token)
      return res.status(400).json({
        success: false,
        message: "Unauthorized!!",
        token: admin_token,
      });

    const decoded = jwt.decode(admin_token) as JwtPayload;

    if (!decoded)
      return res.status(500).json({
        success: false,
        message: "Failed to decode token!! Internal Server Error!!",
      });

    (req as any).adminId = decoded.id;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
}
