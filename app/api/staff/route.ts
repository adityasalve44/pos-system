import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { can } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const session = await auth();

    // ── Auth & Authorization ──────────────────────────────────────────────
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const role = (session.user as any).role as Role;
    if (!can(role, "staff_view")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const restaurantId = (session.user as any).restaurantId;

    // ── Query all active staff for this restaurant ──────────────────────────
    const staff = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.restaurantId, restaurantId),
          eq(users.isActive, 1)
        )
      );

    return Response.json({ data: staff });
  } catch (err) {
    console.error("[GET /api/staff]", err);
    return Response.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
    const body = await req.json();

    // ── Validate input ────────────────────────────────────────────────────
    const { name, email, password, role: staffRole } = body;

    if (!name || !email || !password) {
      return Response.json(
        { error: "Missing required fields: name, email, password" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (!["admin", "manager", "staff"].includes(staffRole)) {
      return Response.json(
        { error: "Invalid role. Must be admin, manager, or staff" },
        { status: 400 }
      );
    }

    // ── Check for duplicate email ──────────────────────────────────────────
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return Response.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // ── Hash password ─────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 10);

    // ── Create staff member ───────────────────────────────────────────────
    const userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      restaurantId,
      name,
      email,
      passwordHash,
      role: staffRole || "staff",
      isActive: 1,
    });

    // ── Fetch and return the created user ─────────────────────────────────
    const [newUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return Response.json({ data: newUser }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/staff]", err);
    return Response.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}
