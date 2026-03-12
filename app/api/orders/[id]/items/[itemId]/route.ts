import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { orders, orderItems, restaurants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

async function recalcTotals(orderId: string, restaurantId: string) {
  const [rest] = await db.select({ gstEnabled: restaurants.gstEnabled, taxRate: restaurants.taxRate })
    .from(restaurants).where(eq(restaurants.id, restaurantId));
  const items = await db.select({ lineTotal: orderItems.lineTotal }).from(orderItems).where(eq(orderItems.orderId, orderId));
  const sub = items.reduce((s, i) => s + parseFloat(i.lineTotal), 0);
  const rate = rest.gstEnabled ? parseFloat(rest.taxRate) / 100 : 0;
  const tax = parseFloat((sub * rate).toFixed(2));
  await db.update(orders).set({ subtotal: sub.toFixed(2), taxAmount: tax.toFixed(2), totalAmount: (sub + tax).toFixed(2) }).where(eq(orders.id, orderId));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;
  const { id: orderId, itemId } = await params;

  const [order] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.restaurantId, restaurantId)));
  if (!order || order.status !== "open") return NextResponse.json({ error: "Order not editable" }, { status: 400 });

  const parsed = z.object({ quantity: z.number().min(1).max(999) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const [item] = await db.select().from(orderItems).where(and(eq(orderItems.id, itemId), eq(orderItems.orderId, orderId)));
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const lineTotal = (parseFloat(item.unitPrice) * parsed.data.quantity).toFixed(2);
  await db.update(orderItems).set({ quantity: parsed.data.quantity, lineTotal }).where(eq(orderItems.id, itemId));
  await recalcTotals(orderId, restaurantId);

  return NextResponse.json({ data: { success: true } });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;
  const { id: orderId, itemId } = await params;

  const [order] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.restaurantId, restaurantId)));
  if (!order || order.status !== "open") return NextResponse.json({ error: "Order not editable" }, { status: 400 });

  await db.delete(orderItems).where(and(eq(orderItems.id, itemId), eq(orderItems.orderId, orderId)));
  await recalcTotals(orderId, restaurantId);

  return NextResponse.json({ data: { success: true } });
}
