import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.string().min(1).max(100).optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  isAvailable: z.number().min(0).max(1).optional(),
  sortOrder: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const restaurantId = (session.user as any).restaurantId;
  const { id } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  await db
    .update(products)
    .set(parsed.data)
    .where(and(eq(products.id, id), eq(products.restaurantId, restaurantId)));

  const [product] = await db.select().from(products).where(eq(products.id, id));
  return NextResponse.json({ data: product });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const restaurantId = (session.user as any).restaurantId;
  const { id } = await params;

  await db
    .update(products)
    .set({ isAvailable: 0 })
    .where(and(eq(products.id, id), eq(products.restaurantId, restaurantId)));

  return NextResponse.json({ data: { success: true } });
}
