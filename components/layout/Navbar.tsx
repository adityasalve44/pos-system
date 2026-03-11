"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutGrid,
  Package,
  BarChart2,
  LogOut,
  Truck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Users2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { can } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: Parameters<typeof can>[1];
};

const NAV: NavItem[] = [
  { href: "/tables", label: "Tables", icon: LayoutGrid },
  { href: "/takeout", label: "Takeout", icon: Truck },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart2,
    permission: "reports_view",
  },
  {
    href: "/products",
    label: "Products",
    icon: Package,
    permission: "products_manage",
  },
  { href: "/staff", label: "Staff", icon: Users2, permission: "staff_view" },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    permission: "settings_view",
  },
];

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-red-100 text-red-700" },
  manager: { label: "Manager", color: "bg-blue-100 text-blue-700" },
  staff: { label: "Staff", color: "bg-gray-100 text-gray-600" },
};

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as Role | undefined;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pos-sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("pos-sidebar-collapsed", String(next));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "pos-sidebar-collapsed",
        newValue: String(next),
      }),
    );
  }

  // Filter nav items by role
  const links = NAV.filter((n) => !n.permission || can(role, n.permission));

  const isActive = (href: string) =>
    href === "/tables"
      ? pathname === href ||
        pathname.startsWith("/orders") ||
        pathname.startsWith("/tables")
      : pathname.startsWith(href);

  const badge = role ? ROLE_BADGE[role] : null;

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex flex-col min-h-screen bg-gray-900 text-white fixed left-0 top-0 z-40 transition-[width] duration-200 ${collapsed ? "w-16" : "w-56"}`}
      >
        {/* Logo */}
        <div
          className={`flex items-center border-b border-gray-700 h-14 px-3 ${collapsed ? "justify-center" : "gap-2"}`}
        >
          <span className="text-xl shrink-0">🍽️</span>
          {!collapsed && (
            <span className="font-bold text-sm">RestaurantPOS</span>
          )}
        </div>

        {/* Role badge */}
        {!collapsed && badge && (
          <div className="px-4 py-2 border-b border-gray-800">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}
            >
              {badge.label}
            </span>
            <span className="text-gray-400 text-xs ml-2 truncate">
              {session?.user?.name}
            </span>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive(href) ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}
                ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && label}
            </Link>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="border-t border-gray-700 px-2 py-3 space-y-1">
          {!collapsed && (
            <div className="px-2 py-1 text-xs text-gray-400 truncate">
              {session?.user?.email}
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={collapsed ? "Sign out" : undefined}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && "Sign out"}
          </button>
          <button
            onClick={toggleCollapse}
            title={collapsed ? "Expand" : "Collapse"}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 text-xs transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            {collapsed ? (
              <ChevronRight size={15} />
            ) : (
              <>
                <ChevronLeft size={15} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 text-white z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍽️</span>
          <span className="font-bold text-sm">RestaurantPOS</span>
          {badge && (
            <span
              className={`hidden xs:inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}
            >
              {badge.label}
            </span>
          )}
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-gray-300 hover:text-white"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-gray-900 text-white flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-700 h-14">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍽️</span>
                <span className="font-bold text-sm">RestaurantPOS</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            {/* User info in drawer */}
            <div className="px-4 py-3 border-b border-gray-800 space-y-0.5">
              <div className="text-sm font-medium text-gray-200">
                {session?.user?.name}
              </div>
              <div className="text-xs text-gray-500">
                {session?.user?.email}
              </div>
              {badge && (
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}
                >
                  {badge.label}
                </span>
              )}
            </div>
            <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    ${isActive(href) ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"}`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-700 p-4">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile bottom tab bar — show up to 4 most important links */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40">
        {links.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5
              ${isActive(href) ? "text-blue-600" : "text-gray-500"}`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex-1 flex flex-col items-center py-2 text-xs gap-0.5 text-gray-500"
        >
          <LogOut size={20} />
          Out
        </button>
      </nav>
    </>
  );
}
