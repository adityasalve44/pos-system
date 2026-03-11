import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { orderItems, orders } from "@/lib/db/schema";
import { eq, and, gte, lte, sum, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { SessionUser } from "@/types";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as unknown as SessionUser;

  if (!["admin", "manager"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  const conditions = [eq(orders.restaurantId, user.restaurantId)];
  if (dateFrom) conditions.push(gte(orders.openedAt, new Date(dateFrom)));
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59);
    conditions.push(lte(orders.openedAt, end));
  }

  const result = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      totalQuantity: sum(orderItems.quantity),
      totalRevenue: sum(orderItems.lineTotal),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(...conditions))
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(desc(sum(orderItems.lineTotal)))
    .limit(20);

  return NextResponse.json({ products: result });
}
