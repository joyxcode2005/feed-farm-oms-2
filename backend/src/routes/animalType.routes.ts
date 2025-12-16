import { Router, Request, Response } from "express";
import { z } from "zod";
import { createAnimalTypeDB, getAnimalTypesDB } from "../controllers/animalType.controller";

const router = Router();

const createAnimalTypeSchema = z.object({
  name: z.string().min(1, "Animal type name is required")
});

/**
 * Route to create animal type
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createAnimalTypeSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    try {
      const animalType = await createAnimalTypeDB(parsed.data);

      return res.status(201).json({
        success: true,
        message: "Animal type created successfully",
        data: animalType
      });
    } catch (err: any) {
      // unique constraint on name
      if (err.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "Animal type already exists"
        });
      }
      throw err;
    }
  } catch (error) {
    console.error("Animal type creation failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!"
    });
  }
});


/**
 * Route to get all animal types
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const animalTypes = await getAnimalTypesDB();

    return res.status(200).json({
      success: true,
      message: "Animal types fetched successfully",
      data: animalTypes
    });
  } catch (error) {
    console.error("Fetching animal types failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!"
    });
  }
});

export default router;
