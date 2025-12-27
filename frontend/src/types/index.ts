export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELED";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  district: string;
  address?: string;
  type: "SINGLE" | "DISTRIBUTER";
}

export interface OrderItem {
  id: string;
  quantityBags: number;
  subtotal: number;
  feedCatagory: {
    name: string;
  };
}

export interface Order {
  id: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  deliveryDate: string;
  createdAt: string;
  customer: Pick<Customer, "name" | "phone" | "address">;
  items: OrderItem[];
}

export type AdminRole = "SUPER_ADMIN" | "ADMIN";
export interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  district: string;
  address?: string;
  type: "SINGLE" | "DISTRIBUTER";
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  district: string;
  totalPurchased: number;
  totalPaid: number;
  totalOutstanding: number;
}

// --- Inventory & Feed Types ---
export interface RawMaterial {
  id: string;
  name: string;
  unit: "KG" | "TON";
  currentStock: number;
}

export interface AnimalType {
  id: string;
  name: string;
}

export interface FeedCategory {
  id: string;
  name: string;
  unitSizeKg: number;
  defaultPrice: number;
  animalType: AnimalType;
}

export interface FeedStock {
  feedCategroyId: string;
  animalType: string;
  feedName: string;
  unitSize: number;
  quantityAvailableBags: number;
}

//Expense type
export interface Expense {
  id: string;
  category: string;
  amount: number;
  note?: string;
  expenseDate: string;
  createdAt: string;
}