import { Router, Request, Response } from "express";
import { z } from "zod";
import { createFeedCategoryDB, getFeedCategoriesDB } from "../controllers/feedCategory.controller";

const router = Router();

const createFeedCategorySchema = z.object({
  animalTypeId: z.string().uuid(),
  name: z.string().min(1),
  unitSizeKg: z.number().positive(),
  defaultPrice: z.number().positive()
});

/**
 * Route to create feed category
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createFeedCategorySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    try {
      const category = await createFeedCategoryDB(parsed.data);

      return res.status(201).json({
        success: true,
        message: "Feed category created successfully",
        data: category
      });
    } catch (err: any) {
      // unique constraint: @@unique([animalTypeId, name])
      if (err.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "Feed category already exists for this animal type"
        });
      }
      throw err;
    }
  } catch (error) {
    console.error("Feed category creation failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!"
    });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const categories = await getFeedCategoriesDB();

    return res.status(200).json({
      success: true,
      message: "Feed categories fetched successfully",
      data: categories
    });
  } catch (error) {
    console.error("Fetching feed categories failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!"
    });
  }
});


export default router;
