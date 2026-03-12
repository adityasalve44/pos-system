import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { tables } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { can } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (!can(role, "tables_edit"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const restaurantId = session.user.restaurantId;
  const { id } = await params;

  const parsed = z
    .object({
      name: z.string().min(1).optional(),
      capacity: z.number().min(1).optional(),
      status: z.enum(["available", "occupied", "reserved"]).optional(),
    })
    .safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  await db
    .update(tables)
    .set(parsed.data)
    .where(and(eq(tables.id, id), eq(tables.restaurantId, restaurantId)));
  const [table] = await db.select().from(tables).where(eq(tables.id, id));
  return NextResponse.json({ data: table });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (!can(role, "tables_delete"))
    return NextResponse.json(
      { error: "Forbidden: only admin can delete tables" },
      { status: 403 },
    );
  const restaurantId = session.user.restaurantId;
  const { id } = await params;

  await db
    .update(tables)
    .set({ isDeleted: 1 })
    .where(and(eq(tables.id, id), eq(tables.restaurantId, restaurantId)));
  return NextResponse.json({ data: { success: true } });
}
