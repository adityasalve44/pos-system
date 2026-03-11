import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { tables, orders } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { can } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = (session.user as any).restaurantId;

  const allTables = await db.select().from(tables)
    .where(and(eq(tables.restaurantId, restaurantId), eq(tables.isDeleted, 0)))
    .orderBy(tables.name);

  const occupiedIds = allTables.filter(t => t.status === "occupied").map(t => t.id);
  let activeOrders: typeof orders.$inferSelect[] = [];
  if (occupiedIds.length > 0) {
    activeOrders = await db.select().from(orders)
      .where(and(inArray(orders.tableId, occupiedIds), inArray(orders.status, ["open", "billed"])));
  }

  return NextResponse.json({
    data: allTables.map(t => ({ ...t, activeOrder: activeOrders.find(o => o.tableId === t.id) ?? null })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role as Role;
  if (!can(role, "tables_create"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const restaurantId = (session.user as any).restaurantId;

  const parsed = z.object({ name: z.string().min(1), capacity: z.number().min(1).default(4) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const id = crypto.randomUUID();
  await db.insert(tables).values({ id, restaurantId, ...parsed.data });
  const [table] = await db.select().from(tables).where(eq(tables.id, id));
  return NextResponse.json({ data: table }, { status: 201 });
}