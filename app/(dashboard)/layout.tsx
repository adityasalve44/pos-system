"use client";
import { Navbar } from "@/components/layout/Navbar";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setCollapsed(localStorage.getItem("pos-sidebar-collapsed") === "true");
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className={`transition-[margin] duration-200 pt-14 pb-16 md:pt-0 md:pb-0 ${collapsed ? "md:ml-16" : "md:ml-56"}`}>
        {children}
      </main>
    </div>
  );
}
