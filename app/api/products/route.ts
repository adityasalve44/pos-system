import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  sortOrder: z.number().optional().default(0),
});

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const restaurantId = session.user.restaurantId;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.restaurantId, restaurantId))
    .orderBy(asc(products.sortOrder), asc(products.name));

  return NextResponse.json({ data: result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userRole = session.user.role;
  if (userRole !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const restaurantId = session.user.restaurantId;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const id = crypto.randomUUID();
  await db.insert(products).values({ id, restaurantId, ...parsed.data });
  const [product] = await db.select().from(products).where(eq(products.id, id));
  return NextResponse.json({ data: product }, { status: 201 });
}
