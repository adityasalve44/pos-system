import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { orders, payments, tables } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = (session.user as any).restaurantId;
  const userId = session.user.id!;
  const { id } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status !== "billed") return NextResponse.json({ error: "Order must be billed first" }, { status: 400 });

  const body = await req.json();
  const schema = z.object({
    amount: z.number().positive(),
    paymentMethod: z.enum(["cash", "upi", "card", "other"]),
    referenceNo: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const paymentId = crypto.randomUUID();
  await db.insert(payments).values({
    id: paymentId,
    orderId: id,
    restaurantId,
    amount: parsed.data.amount.toFixed(2),
    paymentMethod: parsed.data.paymentMethod,
    referenceNo: parsed.data.referenceNo ?? null,
    recordedBy: userId,
  });

  await db
    .update(orders)
    .set({ status: "paid", closedAt: new Date() })
    .where(eq(orders.id, id));

  if (order.tableId) {
    await db.update(tables).set({ status: "available" }).where(eq(tables.id, order.tableId));
  }

  const [updated] = await db.select().from(orders).where(eq(orders.id, id));
  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
  return NextResponse.json({ data: { order: updated, payment } });
}
