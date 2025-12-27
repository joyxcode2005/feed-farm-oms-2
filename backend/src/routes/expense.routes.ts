import { Router, Request, Response } from "express";
import { createExpenseDB, getExpensesDB, deleteExpenseDB } from "../controllers/expense.controller";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { from, to, category } = req.query;
  const expenses = await getExpensesDB({
    from: from ? new Date(from as string) : undefined,
    to: to ? new Date(to as string) : undefined,
    category: category as string,
  });
  res.json({ success: true, data: expenses });
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const expense = await createExpenseDB(req.body);
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to create expense" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  await deleteExpenseDB(req.params.id);
  res.json({ success: true, message: "Expense deleted" });
});

export default router;