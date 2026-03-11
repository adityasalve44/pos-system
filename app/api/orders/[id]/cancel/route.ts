import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { orders, tables } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { can } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role as Role;
  const restaurantId = (session.user as any).restaurantId;
  const { id } = await params;

  if (!can(role, "orders_cancel"))
    return NextResponse.json(
      { error: "Forbidden: only admin/manager can cancel orders" },
      { status: 403 },
    );

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!["open", "billed"].includes(order.status))
    return NextResponse.json(
      { error: "Cannot cancel this order" },
      { status: 400 },
    );

  await db
    .update(orders)
    .set({ status: "cancelled", closedAt: new Date() })
    .where(eq(orders.id, id));

  if (order.tableId) {
    await db
      .update(tables)
      .set({ status: "available" })
      .where(eq(tables.id, order.tableId));
  }

  const [updated] = await db.select().from(orders).where(eq(orders.id, id));
  return NextResponse.json({ data: updated });
}
