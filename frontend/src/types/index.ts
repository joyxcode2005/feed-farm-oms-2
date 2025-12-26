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
