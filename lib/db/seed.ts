import "dotenv/config";
import { db } from "./client";
import { restaurants, users, tables, products, categories } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  const restaurantId = crypto.randomUUID();
  await db.insert(restaurants).values({
    id: restaurantId,
    name: "Demo Biryani House",
    address: "123 MG Road, Pune, Maharashtra",
    phone: "+91 98765 43210",
    gstEnabled: 1,
    gstType: "CGST_SGST",
    gstNumber: "27AABCU9603R1ZX",
    taxRate: "5.00",
  });

  const adminId = crypto.randomUUID();
  await db.insert(users).values({
    id: adminId,
    restaurantId,
    name: "Admin User",
    email: "admin@demo.com",
    passwordHash: await bcrypt.hash("admin123", 12),
    role: "admin",
  });
  await db.insert(users).values({
    id: crypto.randomUUID(),
    restaurantId,
    name: "Staff Member",
    email: "staff@demo.com",
    passwordHash: await bcrypt.hash("staff123", 12),
    role: "staff",
  });
  console.log("✅ Users: admin@demo.com / admin123");

  for (const t of [
    { name: "Table 1", capacity: 2 },
    { name: "Table 2", capacity: 4 },
    { name: "Table 3", capacity: 4 },
    { name: "Table 4", capacity: 6 },
    { name: "Table 5", capacity: 6 },
    { name: "Table 6", capacity: 8 },
    { name: "VIP Room", capacity: 10 },
    { name: "Outdoor 1", capacity: 4 },
  ])
    await db
      .insert(tables)
      .values({ id: crypto.randomUUID(), restaurantId, ...t });
  console.log("✅ Tables created");

  // Seed categories
  const cats = [
    "Biryani",
    "Starters",
    "Main Course",
    "Breads",
    "Beverages",
    "Desserts",
  ];
  for (let i = 0; i < cats.length; i++) {
    await db.insert(categories).values({
      id: crypto.randomUUID(),
      restaurantId,
      name: cats[i],
      sortOrder: i,
    });
  }

  for (const p of [
    {
      category: "Biryani",
      name: "Chicken Biryani",
      price: "280.00",
      sortOrder: 1,
    },
    {
      category: "Biryani",
      name: "Mutton Biryani",
      price: "350.00",
      sortOrder: 2,
    },
    { category: "Biryani", name: "Veg Biryani", price: "200.00", sortOrder: 3 },
    { category: "Biryani", name: "Egg Biryani", price: "220.00", sortOrder: 4 },
    { category: "Starters", name: "Chicken 65", price: "180.00", sortOrder: 5 },
    {
      category: "Starters",
      name: "Paneer Tikka",
      price: "160.00",
      sortOrder: 6,
    },
    {
      category: "Main Course",
      name: "Butter Chicken",
      price: "260.00",
      sortOrder: 7,
    },
    {
      category: "Main Course",
      name: "Dal Makhani",
      price: "180.00",
      sortOrder: 8,
    },
    { category: "Breads", name: "Naan", price: "30.00", sortOrder: 9 },
    {
      category: "Breads",
      name: "Tandoori Roti",
      price: "25.00",
      sortOrder: 10,
    },
    { category: "Beverages", name: "Lassi", price: "60.00", sortOrder: 11 },
    {
      category: "Beverages",
      name: "Soft Drink",
      price: "40.00",
      sortOrder: 12,
    },
    {
      category: "Desserts",
      name: "Gulab Jamun",
      price: "60.00",
      sortOrder: 13,
    },
    { category: "Desserts", name: "Ice Cream", price: "80.00", sortOrder: 14 },
  ])
    await db
      .insert(products)
      .values({ id: crypto.randomUUID(), restaurantId, ...p });
  console.log("✅ Products + categories created");

  console.log("\n🎉 Seed complete! Login: admin@demo.com / admin123");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
