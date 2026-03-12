import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { orders, tables } from "@/lib/db/schema";
import { eq, and, inArray, max } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;
  const data = await db.select().from(orders)
    .where(and(eq(orders.restaurantId, restaurantId), inArray(orders.status, ["open", "billed"])))
    .orderBy(orders.openedAt);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;
  const userId = session.user.id!;

  const parsed = z.object({
    tableId: z.string().uuid().optional(),
    orderType: z.enum(["dine_in", "takeout"]),
    customerName: z.string().max(100).optional(),
    notes: z.string().optional(),
  }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  if (parsed.data.orderType === "takeout" && !parsed.data.customerName)
    return NextResponse.json({ error: "Customer name required for takeout" }, { status: 400 });

  // Fix 11: auto-increment order number per restaurant
  const [{ maxNum }] = await db.select({ maxNum: max(orders.orderNumber) }).from(orders).where(eq(orders.restaurantId, restaurantId));
  const orderNumber = (maxNum ?? 0) + 1;

  const id = crypto.randomUUID();
  await db.insert(orders).values({
    id, orderNumber, restaurantId,
    tableId: parsed.data.tableId ?? null,
    orderType: parsed.data.orderType,
    customerName: parsed.data.customerName ?? null,
    notes: parsed.data.notes ?? null,
    openedBy: userId,
  });

  if (parsed.data.tableId) {
    await db.update(tables).set({ status: "occupied" })
      .where(and(eq(tables.id, parsed.data.tableId), eq(tables.restaurantId, restaurantId)));
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  return NextResponse.json({ data: order }, { status: 201 });
}
