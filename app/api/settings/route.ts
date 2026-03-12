import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { restaurants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;
  const [r] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));
  return NextResponse.json({ data: r });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const restaurantId = session.user.restaurantId;

  const parsed = z.object({
    name: z.string().min(1).optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    gstEnabled: z.number().min(0).max(1).optional(),
    gstType: z.enum(["GST", "CGST_SGST", "IGST"]).optional(),
    gstNumber: z.string().max(50).optional(),
    taxRate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  await db.update(restaurants).set(parsed.data).where(eq(restaurants.id, restaurantId));
  const [updated] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));
  return NextResponse.json({ data: updated });
}
