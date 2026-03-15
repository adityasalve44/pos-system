/**
 * lib/rbac.ts — Role-based access control.
 *
 * `Role` is re-exported from @/types as `UserRole` so the session augmentation
 * and all RBAC helpers share a single type definition. No casts needed.
 */
import type { UserRole } from "@/types";

export type Role = UserRole;

export const PERMISSIONS = {
  // Tables
  tables_view:       ["admin", "manager", "staff"] as Role[],
  tables_create:     ["admin", "manager"] as Role[],
  tables_edit:       ["admin", "manager"] as Role[],
  tables_delete:     ["admin",] as Role[],

  // Orders
  orders_create:     ["admin", "manager", "staff"] as Role[],
  orders_add_item:   ["admin", "manager", "staff"] as Role[],
  orders_bill:       ["admin", "manager", "staff"] as Role[],
  orders_pay:        ["admin", "manager", "staff"] as Role[],
  orders_cancel:     ["admin", "manager"] as Role[],

  // Products / Categories
  products_view:     ["admin", "manager", "staff"] as Role[],
  products_manage:   ["admin", "manager"] as Role[],
  categories_manage: ["admin", "manager"] as Role[],

  // Reports
  reports_view:      ["admin", "manager"] as Role[],

  // Settings
  settings_view:     ["admin", "manager"] as Role[],
  settings_edit:     ["admin"] as Role[],

  // Staff management
  staff_view:        ["admin", "manager"] as Role[],
  staff_manage:      ["admin"] as Role[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as Role[]).includes(role);
}

export function requirePermission(role: Role | undefined | null, permission: Permission): void {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: requires ${(PERMISSIONS[permission] as Role[]).join(" or ")} role`);
  }
}

/** Page-level route → minimum roles allowed. Used in proxy.ts. */
export const ROUTE_ROLES: Record<string, Role[]> = {
  "/tables":   ["admin", "manager", "staff"],
  "/takeout":  ["admin", "manager", "staff"],
  "/orders":   ["admin", "manager", "staff"],
  "/products": ["admin", "manager"],
  "/reports":  ["admin", "manager"],
  "/settings": ["admin", "manager"],
  "/staff":    ["admin", "manager"],
};

export function canAccessRoute(role: Role | undefined | null, pathname: string): boolean {
  if (!role) return false;
  const match = Object.keys(ROUTE_ROLES).find(r => pathname === r || pathname.startsWith(r + "/"));
  if (!match) return true;
  return (ROUTE_ROLES[match] as Role[]).includes(role);
}
