import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { can } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = (session.user as any).restaurantId;
  const data = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, restaurantId))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role as Role;
  if (!can(role, "categories_manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const restaurantId = (session.user as any).restaurantId;

  const parsed = z
    .object({
      name: z.string().min(1).max(100),
      sortOrder: z.number().default(0),
    })
    .safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const id = crypto.randomUUID();
  await db.insert(categories).values({ id, restaurantId, ...parsed.data });
  const [cat] = await db.select().from(categories).where(eq(categories.id, id));
  return NextResponse.json({ data: cat }, { status: 201 });
}
