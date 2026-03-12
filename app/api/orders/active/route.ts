import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;

  const activeOrders = await db
    .select()
    .from(orders)
    .where(and(eq(orders.restaurantId, restaurantId), inArray(orders.status, ["open", "billed"])))
    .orderBy(orders.openedAt);

  return NextResponse.json({ data: activeOrders });
}
