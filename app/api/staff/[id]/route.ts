import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { can } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    // ── Auth & Authorization ──────────────────────────────────────────────
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const role = (session.user as any).role as Role;
    if (!can(role, "staff_manage")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const restaurantId = (session.user as any).restaurantId;
    const staffId = params.id;
    const body = await req.json();

    // ── Verify staff member exists and belongs to this restaurant ──────────
    const [staff] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, staffId),
          eq(users.restaurantId, restaurantId)
        )
      )
      .limit(1);

    if (!staff) {
      return Response.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // ── Prepare update data ───────────────────────────────────────────────
    const updateData: Record<string, any> = {};

    // Update name if provided
    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return Response.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = body.name;
    }

    // Update email if provided (check for duplicates)
    if (body.email !== undefined) {
      if (!body.email.trim()) {
        return Response.json(
          { error: "Email cannot be empty" },
          { status: 400 }
        );
      }

      // Check if new email is already in use (excluding current user)
      if (body.email !== staff.email) {
        const duplicate = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, body.email))
          .limit(1);

        if (duplicate.length > 0) {
          return Response.json(
            { error: "Email already in use" },
            { status: 409 }
          );
        }
      }

      updateData.email = body.email;
    }

    // Update role if provided
    if (body.role !== undefined) {
      if (!["admin", "manager", "staff"].includes(body.role)) {
        return Response.json(
          { error: "Invalid role. Must be admin, manager, or staff" },
          { status: 400 }
        );
      }
      updateData.role = body.role;
    }

    // Update password if provided (hash it)
    if (body.password !== undefined) {
      if (body.password.length < 6) {
        return Response.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      updateData.passwordHash = await bcrypt.hash(body.password, 10);
    }

    // Update isActive status if provided (soft delete logic)
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "number" || ![0, 1].includes(body.isActive)) {
        return Response.json(
          { error: "isActive must be 0 or 1" },
          { status: 400 }
        );
      }
      updateData.isActive = body.isActive;
    }

    // ── Prevent deactivating the only admin ──────────────────────────────
    if (body.isActive === 0 && staff.role === "admin") {
      const adminCount = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.restaurantId, restaurantId),
            eq(users.role, "admin"),
            eq(users.isActive, 1)
          )
        );

      if (adminCount.length === 1) {
        return Response.json(
          { error: "Cannot deactivate the only admin account" },
          { status: 409 }
        );
      }
    }

    // ── Update the staff member ───────────────────────────────────────────
    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { error: "No update fields provided" },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, staffId));

    // ── Fetch and return updated user ─────────────────────────────────────
    const [updatedUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, staffId))
      .limit(1);

    return Response.json({ data: updatedUser });
  } catch (err) {
    console.error("[PUT /api/staff/:id]", err);
    return Response.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    // ── Auth & Authorization ──────────────────────────────────────────────
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const role = (session.user as any).role as Role;
    if (!can(role, "staff_manage")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const restaurantId = (session.user as any).restaurantId;
    const staffId = params.id;

    // ── Verify staff member exists and belongs to this restaurant ──────────
    const [staff] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, staffId),
          eq(users.restaurantId, restaurantId)
        )
      )
      .limit(1);

    if (!staff) {
      return Response.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // ── Prevent deleting the only admin ──────────────────────────────────
    if (staff.role === "admin") {
      const adminCount = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.restaurantId, restaurantId),
            eq(users.role, "admin"),
            eq(users.isActive, 1)
          )
        );

      if (adminCount.length === 1) {
        return Response.json(
          { error: "Cannot delete the only admin account" },
          { status: 409 }
        );
      }
    }

    // ── Soft delete: set isActive = 0 ───────────────────────────────────
    await db
      .update(users)
      .set({ isActive: 0 })
      .where(eq(users.id, staffId));

    return Response.json(
      { message: "Staff member deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("[DELETE /api/staff/:id]", err);
    return Response.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
}
