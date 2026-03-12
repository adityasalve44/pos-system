import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { orders, payments,  } from "@/lib/db/schema";
import { eq, and, between, sum, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const start = new Date(date + "T00:00:00");
  const end = new Date(date + "T23:59:59");

  const [stats] = await db
    .select({ orderCount: count(), totalRevenue: sum(orders.totalAmount) })
    .from(orders)
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        eq(orders.status, "paid"),
        between(orders.closedAt, start, end)
      )
    );

  const paymentBreakdown = await db
    .select({ paymentMethod: payments.paymentMethod, total: sum(payments.amount) })
    .from(payments)
    .where(and(eq(payments.restaurantId, restaurantId), between(payments.recordedAt, start, end)))
    .groupBy(payments.paymentMethod);

  return NextResponse.json({
    data: {
      date,
      orderCount: stats.orderCount,
      totalRevenue: stats.totalRevenue ?? "0",
      byPaymentMethod: Object.fromEntries(paymentBreakdown.map((p) => [p.paymentMethod, p.total])),
    },
  });
}
