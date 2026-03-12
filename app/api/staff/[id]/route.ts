import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { can } from "@/lib/rbac";

type RouteParams = { params: Promise<{ id: string }> };

const PUBLIC_COLS = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  isActive: users.isActive,
  createdAt: users.createdAt,
} as const;

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  /** Only non-admin roles can be assigned via this endpoint */
  role: z.enum(["manager", "staff"]).optional(),
  isActive: z.number().min(0).max(1).optional(),
  password: z.string().min(6).max(72).optional(),
});

async function resolveTarget(
  targetId: string,
  restaurantId: string,
): Promise<{ id: string; role: string; restaurantId: string } | null> {
  const [target] = await db
    .select({
      id: users.id,
      role: users.role,
      restaurantId: users.restaurantId,
    })
    .from(users)
    .where(eq(users.id, targetId))
    .limit(1);

  if (!target || target.restaurantId !== restaurantId) return null;
  return target;
}

/** PUT /api/staff/:id — update name, email, role, isActive, or password */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(session.user.role, "staff_manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { restaurantId } = session.user;

  const target = await resolveTarget(id, restaurantId);
  if (!target) {
    return NextResponse.json(
      { error: "Staff member not found" },
      { status: 404 },
    );
  }

  // Admin accounts are protected — no edits through this endpoint
  if (target.role === "admin") {
    return NextResponse.json(
      { error: "Admin accounts cannot be edited through this endpoint" },
      { status: 403 },
    );
  }

  const body: unknown = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const update: Record<string, string | number> = {};

  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.email !== undefined) update.email = parsed.data.email;
  if (parsed.data.role !== undefined) update.role = parsed.data.role;
  if (parsed.data.isActive !== undefined)
    update.isActive = parsed.data.isActive;
  if (parsed.data.password !== undefined) {
    update.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db
    .update(users)
    .set(update)
    .where(and(eq(users.id, id), eq(users.restaurantId, restaurantId)));

  const [updated] = await db
    .select(PUBLIC_COLS)
    .from(users)
    .where(eq(users.id, id));

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/staff/:id — soft-deactivate (preserves order history).
 * Cannot deactivate your own account or an admin account.
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(session.user.role, "staff_manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { restaurantId, id: callerId } = session.user;

  if (id === callerId) {
    return NextResponse.json(
      { error: "You cannot deactivate your own account" },
      { status: 400 },
    );
  }

  const target = await resolveTarget(id, restaurantId);
  if (!target) {
    return NextResponse.json(
      { error: "Staff member not found" },
      { status: 404 },
    );
  }

  if (target.role === "admin") {
    return NextResponse.json(
      { error: "Admin accounts cannot be deactivated" },
      { status: 403 },
    );
  }

  await db
    .update(users)
    .set({ isActive: 0 })
    .where(and(eq(users.id, id), eq(users.restaurantId, restaurantId)));

  return NextResponse.json({ data: { success: true } });
}
