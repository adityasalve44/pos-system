import "server-only";
import { db } from "@/lib/db/client";
import { orders, orderItems, restaurants, tables, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatDateTime } from "@/lib/utils/format";

export interface ReceiptPayload {
  restaurantName: string;
  restaurantAddress: string | null;
  restaurantPhone: string | null;
  gstNumber: string | null;
  receiptNumber: string;
  tableName: string | null;
  customerName: string | null;
  orderType: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  subtotal: string;
  taxAmount: string;
  taxRate: string;
  totalAmount: string;
  paymentMethod: string | null;
  billedAt: string;
  openedAt: string;
}

export async function generateReceiptPayload(orderId: string): Promise<ReceiptPayload> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new Error("Order not found");

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, order.restaurantId));

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  let tableName: string | null = null;
  if (order.tableId) {
    const [table] = await db.select({ name: tables.name }).from(tables).where(eq(tables.id, order.tableId));
    tableName = table?.name ?? null;
  }

  const [payment] = await db
    .select({ paymentMethod: payments.paymentMethod })
    .from(payments)
    .where(eq(payments.orderId, orderId));

  return {
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    restaurantPhone: restaurant.phone,
    gstNumber: restaurant.gstNumber,
    receiptNumber: orderId.slice(-8).toUpperCase(),
    tableName,
    customerName: order.customerName,
    orderType: order.orderType,
    items: items.map((i) => ({
      name: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    taxRate: restaurant.taxRate,
    totalAmount: order.totalAmount,
    paymentMethod: payment?.paymentMethod ?? null,
    billedAt: order.billedAt ? formatDateTime(order.billedAt) : formatDateTime(new Date()),
    openedAt: formatDateTime(order.openedAt),
  };
}

export function renderReceiptHTML(payload: ReceiptPayload): string {
  const itemRows = payload.items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td class="qty">${item.quantity}</td>
        <td class="price">₹${parseFloat(item.unitPrice).toFixed(2)}</td>
        <td class="price">₹${parseFloat(item.lineTotal).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Receipt #${payload.receiptNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @media print {
    body { width: 80mm; font-family: monospace; font-size: 9pt; }
    .no-print { display: none; }
  }
  body { width: 80mm; font-family: monospace; font-size: 10pt; padding: 4mm; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 3mm 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1mm 0; }
  .qty { text-align: center; width: 12mm; }
  .price { text-align: right; width: 20mm; }
  .totals td { font-weight: bold; }
  .total-row td { font-size: 12pt; }
</style>
</head>
<body>
  <div class="center bold">${payload.restaurantName}</div>
  ${payload.restaurantAddress ? `<div class="center">${payload.restaurantAddress}</div>` : ""}
  ${payload.restaurantPhone ? `<div class="center">Tel: ${payload.restaurantPhone}</div>` : ""}
  ${payload.gstNumber ? `<div class="center">GSTIN: ${payload.gstNumber}</div>` : ""}
  <div class="divider"></div>
  <div>Receipt #: ${payload.receiptNumber}</div>
  <div>Date: ${payload.billedAt}</div>
  ${payload.tableName ? `<div>Table: ${payload.tableName}</div>` : ""}
  ${payload.customerName ? `<div>Customer: ${payload.customerName}</div>` : ""}
  <div>Type: ${payload.orderType === "dine_in" ? "Dine In" : "Takeout"}</div>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <td class="bold">Item</td>
        <td class="bold qty">Qty</td>
        <td class="bold price">Rate</td>
        <td class="bold price">Amt</td>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="divider"></div>
  <table class="totals">
    <tr><td>Subtotal</td><td class="price">₹${parseFloat(payload.subtotal).toFixed(2)}</td></tr>
    <tr><td>GST (${payload.taxRate}%)</td><td class="price">₹${parseFloat(payload.taxAmount).toFixed(2)}</td></tr>
    <tr class="total-row"><td>TOTAL</td><td class="price">₹${parseFloat(payload.totalAmount).toFixed(2)}</td></tr>
    ${payload.paymentMethod ? `<tr><td>Payment</td><td class="price">${payload.paymentMethod.toUpperCase()}</td></tr>` : ""}
  </table>
  <div class="divider"></div>
  <div class="center">Thank you for dining with us!</div>
  <div class="center">Please visit again</div>
  <br>
</body>
</html>`;
}
