import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { can } from "@/lib/rbac";

/** Columns returned to the client — never expose passwordHash */
const PUBLIC_COLS = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  isActive: users.isActive,
  createdAt: users.createdAt,
} as const;

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  /** Admin cannot create another admin through the UI */
  role: z.enum(["manager", "staff"]),
});

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(session.user.role, "staff_view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staff = await db
    .select(PUBLIC_COLS)
    .from(users)
    .where(eq(users.restaurantId, session.user.restaurantId))
    .orderBy(users.role, users.name);

  return NextResponse.json({ data: staff });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(session.user.role, "staff_manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { restaurantId } = session.user;

  // Enforce uniqueness within the restaurant
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.email, parsed.data.email),
        eq(users.restaurantId, restaurantId),
      ),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 },
    );
  }

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.insert(users).values({
    id,
    restaurantId,
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: parsed.data.role,
  });

  const [created] = await db
    .select(PUBLIC_COLS)
    .from(users)
    .where(eq(users.id, id));

  return NextResponse.json({ data: created }, { status: 201 });
}
