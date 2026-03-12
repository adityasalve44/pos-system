import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { eq, and, between, inArray, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = (page - 1) * limit;

  const conditions = [eq(orders.restaurantId, restaurantId)];
  if (status) conditions.push(inArray(orders.status, [status as string]));
  if (dateFrom && dateTo) {
    conditions.push(between(orders.openedAt, new Date(dateFrom), new Date(dateTo + "T23:59:59")));
  }

  const result = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.openedAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ data: result, page, limit });
}
