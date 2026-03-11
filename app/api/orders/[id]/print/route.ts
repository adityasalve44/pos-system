import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  generateReceiptPayload,
  renderReceiptHTML,
} from "@/lib/services/receipt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = (session.user as any).restaurantId;
  const { id } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payload = await generateReceiptPayload(id);
  return NextResponse.json({ data: payload });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const restaurantId = (session.user as any).restaurantId;
  const { id } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
  if (!order) return new Response("Not found", { status: 404 });

  const payload = await generateReceiptPayload(id);
  const html = renderReceiptHTML(payload);
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
