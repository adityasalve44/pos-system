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
import { useState } from "react";
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

const ROLE_BADGE: Record<string, { label: string; bg: string; text: string }> =
  {
    admin: { label: "Admin", bg: "bg-blue-500/20", text: "text-blue-300" },
    manager: { label: "Manager", bg: "bg-sky-500/20", text: "text-sky-300" },
    staff: { label: "Staff", bg: "bg-slate-500/20", text: "text-slate-300" },
  };

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pos-sidebar-collapsed") === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

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
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
        className={`hidden md:flex flex-col min-h-screen fixed left-0 top-0 z-40 transition-[width] duration-200 ${collapsed ? "w-16" : "w-56"}`}
      >
        {/* Logo row */}
        <div
          className={`flex items-center h-14 px-3 shrink-0 ${collapsed ? "justify-center" : "gap-2.5"}`}
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--sidebar-active)" }}
          >
            <span className="text-sm">🍽️</span>
          </div>
          {!collapsed && (
            <span
              className="font-bold text-sm"
              style={{ color: "var(--sidebar-fg)" }}
            >
              RestaurantPOS
            </span>
          )}
        </div>

        {/* User info */}
        {!collapsed && (
          <div
            className="px-3 py-3 shrink-0"
            style={{ borderBottom: "1px solid var(--sidebar-border)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "var(--sidebar-active)" }}
              >
                {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-xs font-semibold truncate"
                  style={{ color: "var(--sidebar-fg)" }}
                >
                  <span style={{ color: "var(--sidebar-fg)" }}>{session?.user?.name}</span>
                </div>
                {badge && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${collapsed ? "justify-center" : ""}
                  ${active ? "text-white shadow-sm" : "hover:text-white"}`}
                style={
                  active
                    ? { background: "var(--sidebar-active)", color: "#fff" }
                    : { color: "var(--sidebar-fg)" }
                }
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--sidebar-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          className="px-2 py-3 space-y-0.5 shrink-0"
          style={{ borderTop: "1px solid var(--sidebar-border)" }}
        >
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={collapsed ? "Sign out" : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all ${collapsed ? "justify-center" : ""}`}
            style={{ color: "var(--sidebar-fg)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--sidebar-hover)";
              (e.currentTarget as HTMLElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color =
                "var(--sidebar-fg)";
            }}
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && "Sign out"}
          </button>
          <button
            onClick={toggleCollapse}
            title={collapsed ? "Expand" : "Collapse"}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all ${collapsed ? "justify-center" : ""}`}
            style={{ color: "var(--sidebar-fg-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--sidebar-hover)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--sidebar-fg)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color =
                "var(--sidebar-fg-muted)";
            }}
          >
            {collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <>
                <ChevronLeft size={14} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ─────────────────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4"
        style={{
          background: "var(--sidebar-bg)",
          borderBottom: "1px solid var(--sidebar-border)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "var(--sidebar-active)" }}
          >
            🍽️
          </div>
          <span
            className="font-bold text-sm"
            style={{ color: "var(--sidebar-fg)" }}
          >
            RestaurantPOS
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2"
          style={{ color: "var(--sidebar-fg)" }}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="relative w-72 flex flex-col h-full shadow-2xl"
            style={{ background: "var(--sidebar-bg)" }}
          >
            <div
              className="flex items-center justify-between px-4 h-14 shrink-0"
              style={{ borderBottom: "1px solid var(--sidebar-border)" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "var(--sidebar-active)" }}
                >
                  🍽️
                </div>
                <span
                  className="font-bold text-sm"
                  style={{ color: "var(--sidebar-fg)" }}
                >
                  RestaurantPOS
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                style={{ color: "var(--sidebar-fg)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* User card in drawer */}
            <div
              className="px-4 py-4 shrink-0"
              style={{ borderBottom: "1px solid var(--sidebar-border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: "var(--sidebar-active)" }}
                >
                  {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {session?.user?.name}
                  </div>
                  <div
                    className="text-xs truncate"
                    style={{ color: "var(--sidebar-fg)" }}
                  >
                    {session?.user?.email}
                  </div>
                  {badge && (
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
              {links.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={
                      active
                        ? { background: "var(--sidebar-active)", color: "#fff" }
                        : { color: "var(--sidebar-fg)" }
                    }
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div
              className="p-4 shrink-0"
              style={{ borderTop: "1px solid var(--sidebar-border)" }}
            >
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 text-sm w-full px-3 py-2 rounded-xl transition-all"
                style={{ color: "var(--sidebar-fg)" }}
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Mobile bottom tab bar ─────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: "var(--sidebar-bg)",
          borderTop: "1px solid var(--sidebar-border)",
        }}
      >
        {links.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 text-[10px] font-medium transition-colors"
              style={{
                color: active ? "var(--sidebar-active)" : "var(--sidebar-fg)",
              }}
            >
              <Icon size={19} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
