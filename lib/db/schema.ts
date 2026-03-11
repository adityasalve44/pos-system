import {
  mysqlTable,
  varchar,
  text,
  decimal,
  int,
  tinyint,
  datetime,
  index,
  char,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const restaurants = mysqlTable("restaurants", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  gstEnabled: tinyint("gst_enabled").notNull().default(1),
  gstType: varchar("gst_type", { length: 10 }).notNull().default("GST"),
  gstNumber: varchar("gst_number", { length: 50 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 })
    .notNull()
    .default("5.00"),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const users = mysqlTable(
  "users",
  {
    id: char("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    restaurantId: char("restaurant_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).notNull().default("staff"),
    isActive: tinyint("is_active").notNull().default(1),
    createdAt: datetime("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({ idxR: index("idx_users_restaurant").on(t.restaurantId) }),
);

// Fix 6: dedicated categories table
export const categories = mysqlTable(
  "categories",
  {
    id: char("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    restaurantId: char("restaurant_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({ idxR: index("idx_cats_restaurant").on(t.restaurantId) }),
);

export const products = mysqlTable(
  "products",
  {
    id: char("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    restaurantId: char("restaurant_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    isAvailable: tinyint("is_available").notNull().default(1),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    idxR: index("idx_products_restaurant").on(t.restaurantId, t.isAvailable),
  }),
);

// Fix 9: isDeleted for soft-delete
export const tables = mysqlTable(
  "tables",
  {
    id: char("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    restaurantId: char("restaurant_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 50 }).notNull(),
    capacity: int("capacity").notNull().default(4),
    status: varchar("status", { length: 20 }).notNull().default("available"),
    isDeleted: tinyint("is_deleted").notNull().default(0),
    createdAt: datetime("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    idxR: index("idx_tables_restaurant").on(t.restaurantId, t.status),
  }),
);

// Fix 11: orderNumber per restaurant
export const orders = mysqlTable(
  "orders",
  {
    id: char("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    orderNumber: int("order_number").notNull().default(1),
    restaurantId: char("restaurant_id", { length: 36 }).notNull(),
    tableId: char("table_id", { length: 36 }),
    orderType: varchar("order_type", { length: 20 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("open"),
    customerName: varchar("customer_name", { length: 100 }),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
    openedBy: char("opened_by", { length: 36 }).notNull(),
    openedAt: datetime("opened_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    billedAt: datetime("billed_at"),
    closedAt: datetime("closed_at"),
  },
  (t) => ({
    idxStatus: index("idx_orders_restaurant_status").on(
      t.restaurantId,
      t.status,
    ),
    idxTable: index("idx_orders_table").on(t.tableId, t.status),
    idxDate: index("idx_orders_date").on(t.restaurantId, t.openedAt),
    idxNum: index("idx_orders_number").on(t.restaurantId, t.orderNumber),
  }),
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: char("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    orderId: char("order_id", { length: 36 }).notNull(),
    productId: char("product_id", { length: 36 }).notNull(),
    productName: varchar("product_name", { length: 255 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: int("quantity").notNull().default(1),
    lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
    addedBy: char("added_by", { length: 36 }).notNull(),
    addedAt: datetime("added_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({ idxOrder: index("idx_order_items_order").on(t.orderId) }),
);

export const payments = mysqlTable(
  "payments",
  {
    id: char("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    orderId: char("order_id", { length: 36 }).notNull(),
    restaurantId: char("restaurant_id", { length: 36 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: varchar("payment_method", { length: 30 }).notNull(),
    referenceNo: varchar("reference_no", { length: 100 }),
    recordedBy: char("recorded_by", { length: 36 }).notNull(),
    recordedAt: datetime("recorded_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    idxDate: index("idx_payments_restaurant_date").on(
      t.restaurantId,
      t.recordedAt,
    ),
  }),
);
