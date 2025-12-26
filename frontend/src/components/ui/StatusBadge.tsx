import { OrderStatus } from "@/src/types";


const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DISPATCHED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusStyles[status]}`}>
    {status}
  </span>
);