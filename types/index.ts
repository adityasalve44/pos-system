export type UserRole = "admin" | "manager" | "staff";
export type TableStatus = "available" | "occupied" | "reserved";
export type OrderStatus = "open" | "billed" | "paid" | "cancelled";
export type OrderType = "dine_in" | "takeout";
export type PaymentMethod = "cash" | "upi" | "card" | "other";
export type GstType = "GST" | "CGST_SGST" | "IGST";

export interface Restaurant {
  id: string; name: string; address: string | null; phone: string | null;
  gstEnabled: number; gstType: GstType; gstNumber: string | null;
  taxRate: string; createdAt: Date;
}

export interface User {
  id: string; restaurantId: string; name: string; email: string;
  role: UserRole; isActive: number; createdAt: Date;
}

export interface Category {
  id: string; restaurantId: string; name: string; sortOrder: number; createdAt: Date;
}

export interface Product {
  id: string; restaurantId: string; name: string; category: string;
  price: string; isAvailable: number; sortOrder: number; createdAt: Date;
}

export interface Table {
  id: string; restaurantId: string; name: string; capacity: number;
  status: TableStatus; isDeleted: number; createdAt: Date;
  activeOrder?: Order | null;
}

export interface Order {
  id: string; orderNumber: number; restaurantId: string; tableId: string | null;
  orderType: OrderType; status: OrderStatus; customerName: string | null;
  subtotal: string; taxAmount: string; totalAmount: string; notes: string | null;
  openedBy: string; openedAt: Date; billedAt: Date | null; closedAt: Date | null;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string; orderId: string; productId: string; productName: string;
  unitPrice: string; quantity: number; lineTotal: string; addedBy: string; addedAt: Date;
}

export interface Payment {
  id: string; orderId: string; restaurantId: string; amount: string;
  paymentMethod: PaymentMethod; referenceNo: string | null;
  recordedBy: string; recordedAt: Date;
}

export interface DailySummary {
  date: string; orderCount: number; totalRevenue: number;
  byPaymentMethod: Record<PaymentMethod, number>;
}

export interface ApiSuccess<T> { data: T; error?: never; }
export interface ApiError { data?: never; error: string; }
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
