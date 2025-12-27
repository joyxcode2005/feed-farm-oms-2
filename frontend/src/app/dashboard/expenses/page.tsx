"use client";

import { useEffect, useState, useCallback } from "react";
import { ExpenseService } from "@/src/services/expense.service";
import { Expense } from "@/src/types";
import { Plus, Trash2, Loader2 } from "lucide-react";
import CreateExpenseModal from "@/src/components/CreateExpenseModal";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Wrap fetchExpenses in useCallback so it can be safely used in useEffect
  // and passed to child components without causing re-renders.
  const fetchExpenses = useCallback(async () => {
    try {
      const data = await ExpenseService.getAll();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  // Use the stable function in the effect
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        await ExpenseService.delete(id);
        fetchExpenses(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete expense", error);
      }
    }
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Business Expenses</h1>
          <p className="text-zinc-500">Track all costs and overheads</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Plus size={20} /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <p className="text-sm text-zinc-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        {isInitialLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 border-b text-sm font-medium text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Note</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No expenses found.
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-zinc-50">
                      <td className="px-6 py-4">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium">{expense.category}</td>
                      <td className="px-6 py-4 text-zinc-500 max-w-xs truncate">{expense.note || "-"}</td>
                      <td className="px-6 py-4 text-right font-bold text-red-600">₹{expense.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDelete(expense.id)} 
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreateExpenseModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchExpenses} 
        />
      )}
    </div>
  );
}