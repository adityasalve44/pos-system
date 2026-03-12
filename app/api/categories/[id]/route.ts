import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const restaurantId = session.user.restaurantId;
  const { id } = await params;
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.restaurantId, restaurantId)));
  return NextResponse.json({ data: { success: true } });
}
