import "server-only";
import { db } from "@/lib/db/client";
import { orders, orderItems, restaurants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function calculateBill(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new Error("Order not found");
  if (order.status !== "open") throw new Error("Order is not open");

  const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, order.restaurantId));
  const items = await db.select({ lineTotal: orderItems.lineTotal }).from(orderItems).where(eq(orderItems.orderId, orderId));

  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.lineTotal), 0);
  const taxRate = restaurant.gstEnabled ? parseFloat(restaurant.taxRate) / 100 : 0;
  const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
  const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

  return {
    subtotal: subtotal.toFixed(2), taxAmount: taxAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2), taxRate: restaurant.taxRate,
    gstEnabled: restaurant.gstEnabled, gstType: restaurant.gstType,
  };
}

export async function lockBill(orderId: string) {
  const amounts = await calculateBill(orderId);
  await db.update(orders).set({
    status: "billed", subtotal: amounts.subtotal,
    taxAmount: amounts.taxAmount, totalAmount: amounts.totalAmount, billedAt: new Date(),
  }).where(eq(orders.id, orderId));
  return amounts;
}
