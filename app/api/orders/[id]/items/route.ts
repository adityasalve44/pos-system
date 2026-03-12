import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { orders, orderItems, products, restaurants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

async function recalcTotals(orderId: string, restaurantId: string) {
  const [rest] = await db.select({ gstEnabled: restaurants.gstEnabled, taxRate: restaurants.taxRate })
    .from(restaurants).where(eq(restaurants.id, restaurantId));
  const items = await db.select({ lineTotal: orderItems.lineTotal }).from(orderItems).where(eq(orderItems.orderId, orderId));
  const sub = items.reduce((s, i) => s + parseFloat(i.lineTotal), 0);
  const rate = rest.gstEnabled ? parseFloat(rest.taxRate) / 100 : 0;
  const tax = parseFloat((sub * rate).toFixed(2));
  const total = parseFloat((sub + tax).toFixed(2));
  await db.update(orders).set({ subtotal: sub.toFixed(2), taxAmount: tax.toFixed(2), totalAmount: total.toFixed(2) })
    .where(eq(orders.id, orderId));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;
  const userId = session.user.id!;
  const { id: orderId } = await params;

  const [order] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.restaurantId, restaurantId)));
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "open") return NextResponse.json({ error: "Order is not open" }, { status: 400 });

  const parsed = z.object({ productId: z.string().uuid(), quantity: z.number().min(1).max(100).default(1) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const [product] = await db.select().from(products).where(and(eq(products.id, parsed.data.productId), eq(products.restaurantId, restaurantId)));
  if (!product || !product.isAvailable) return NextResponse.json({ error: "Product not available" }, { status: 400 });

  // Fix 2: merge same product instead of creating duplicates
  const [existing] = await db.select().from(orderItems)
    .where(and(eq(orderItems.orderId, orderId), eq(orderItems.productId, product.id)));

  if (existing) {
    const newQty = existing.quantity + parsed.data.quantity;
    const lineTotal = (parseFloat(product.price) * newQty).toFixed(2);
    await db.update(orderItems).set({ quantity: newQty, lineTotal }).where(eq(orderItems.id, existing.id));
  } else {
    await db.insert(orderItems).values({
      id: crypto.randomUUID(), orderId, productId: product.id,
      productName: product.name, unitPrice: product.price,
      quantity: parsed.data.quantity,
      lineTotal: (parseFloat(product.price) * parsed.data.quantity).toFixed(2),
      addedBy: userId,
    });
  }

  // Fix 3: recalc live running totals
  await recalcTotals(orderId, restaurantId);

  const allItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, orderId));
  return NextResponse.json({ data: { items: allItems, order: updatedOrder } }, { status: 201 });
}
