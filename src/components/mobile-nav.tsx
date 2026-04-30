"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Ruler,
  Truck,
  BarChart3,
  Warehouse,
  Receipt,
  HardHat,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

const navGroups = [
  {
    label: "Operasional",
    adminOnly: false,
    items: [
      { href: "/pos", label: "Kasir / POS", icon: ShoppingCart, adminOnly: false },
      { href: "/invoice", label: "Invoice", icon: Receipt, adminOnly: false },
      { href: "/pembelian", label: "Pembelian", icon: Truck, adminOnly: true },
      { href: "/stok", label: "Stok", icon: Warehouse, adminOnly: false },
    ],
  },
  {
    label: "Master Data",
    adminOnly: true,
    items: [
      { href: "/produk", label: "Produk", icon: Package, adminOnly: true },
      { href: "/kategori", label: "Kategori", icon: Tag, adminOnly: true },
      { href: "/satuan", label: "Satuan", icon: Ruler, adminOnly: true },
      { href: "/supplier", label: "Supplier", icon: Truck, adminOnly: true },
    ],
  },
  {
    label: "Analisis",
    adminOnly: false,
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
      { href: "/laporan", label: "Laporan", icon: BarChart3, adminOnly: true },
    ],
  },
];

interface MobileNavProps {
  userName?: string;
  userRole?: string;
}

export function MobileNav({ userName = "Admin", userRole = "ADMIN" }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Hamburger button in topbar */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border hover:bg-muted transition-colors md:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 shadow-sm"
              style={{
                background: "linear-gradient(135deg, hsl(237 64% 58%), hsl(237 70% 68%))",
              }}
            >
              <HardHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-sidebar-foreground">
                Toko Bangunan
              </p>
              <p className="text-xs mt-0.5 text-muted-foreground">
                ERP System
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups
            .filter((group) => !group.adminOnly || userRole === "ADMIN")
            .map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.adminOnly || userRole === "ADMIN"
            );
            if (visibleItems.length === 0) return null;
            return (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
                          isActive
                            ? "bg-sidebar-muted text-sidebar-accent font-semibold shadow-sm"
                            : "text-sidebar-foreground/80 hover:bg-muted hover:text-sidebar-foreground"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sidebar-accent" />
                        )}
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0",
                            isActive ? "text-sidebar-accent" : ""
                          )}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-muted/60">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shrink-0 text-white shadow-sm"
              style={{
                background: "linear-gradient(135deg, hsl(237 64% 58%), hsl(237 70% 68%))",
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-none truncate text-sidebar-foreground">
                {userName}
              </p>
              <span
                className="inline-block mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: "hsl(38 92% 50% / 0.15)", color: "hsl(32 80% 38%)" }}
              >
                {userRole}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
