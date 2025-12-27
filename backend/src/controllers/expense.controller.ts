import prisma from "../config/prisma";

export async function createExpenseDB(data: {
  category: string;
  amount: number;
  note?: string;
  expenseDate: Date;
}) {
  return prisma.expense.create({ data });
}

export async function getExpensesDB(filters: { from?: Date; to?: Date; category?: string }) {
  const { from, to, category } = filters;
  const where: any = {};

  if (from || to) {
    where.expenseDate = {};
    if (from) where.expenseDate.gte = from;
    if (to) where.expenseDate.lte = to;
  }
  if (category) where.category = category;

  return prisma.expense.findMany({
    where,
    orderBy: { expenseDate: "desc" },
  });
}

export async function deleteExpenseDB(id: string) {
  return prisma.expense.delete({ where: { id } });
}