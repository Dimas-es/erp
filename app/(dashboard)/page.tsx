import { getDashboardStats } from "@/src/actions/stock";
import { formatRupiah } from "@/src/lib/utils";
import { auth } from "@/src/lib/auth";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
} from "lucide-react";
import { DashboardCharts } from "@/src/components/dashboard-charts";
import { KpiCard } from "@/src/components/kpi-card";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export default async function DashboardPage() {
  const [stats, session] = await Promise.all([
    getDashboardStats(),
    auth(),
  ]);

  const user = session?.user as { name?: string } | undefined;
  const greeting = getGreeting();
  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  return (
    <div className="space-y-6">
      {/* Hero Greeting Card — Light & Friendly */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-6 border bg-card shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, hsl(237 100% 98%) 0%, hsl(38 100% 97%) 100%)",
        }}
      >
        {/* Subtle architect grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(237 64% 30%) 1px, transparent 1px),
              linear-gradient(90deg, hsl(237 64% 30%) 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Indigo glow accent */}
        <div
          className="absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, hsl(237 64% 80%), transparent 70%)",
          }}
        />
        {/* Amber glow accent */}
        <div
          className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, hsl(38 92% 75%), transparent 70%)",
          }}
        />
        <div className="relative">
          <p className="text-sm font-medium text-muted-foreground">
            {greeting},
          </p>
          <h1 className="text-2xl font-bold mt-1 text-foreground">
            {firstName} <span className="inline-block">👋</span>
          </h1>
          <p className="text-sm mt-2 text-muted-foreground">
            {stats.todayTransactions > 0 ? (
              <>
                Hari ini sudah{" "}
                <span className="font-semibold text-primary">
                  {stats.todayTransactions} transaksi
                </span>{" "}
                senilai{" "}
                <span className="font-semibold text-foreground">
                  {formatRupiah(stats.todayRevenue)}
                </span>
              </>
            ) : (
              "Belum ada transaksi hari ini. Semangat!"
            )}
          </p>
        </div>
        {/* Amber accent strip */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background:
              "linear-gradient(90deg, hsl(237 64% 58%), hsl(38 92% 50%))",
          }}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Penjualan Hari Ini"
          value={stats.todayRevenue}
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50 dark:bg-blue-950/30"
          isCurrency={true}
        />
        <KpiCard
          title="Transaksi Hari Ini"
          value={stats.todayTransactions}
          icon={<ShoppingCart className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50 dark:bg-amber-950/30"
          suffix=" trx"
        />
        <KpiCard
          title="Total Produk"
          value={stats.totalProducts}
          icon={<Package className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-50 dark:bg-green-950/30"
          suffix=" produk"
        />
        <KpiCard
          title="Stok Menipis"
          value={stats.lowStockCount}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50 dark:bg-red-950/30"
          suffix=" produk"
        />
      </div>

      <DashboardCharts
        salesChart={stats.salesChart}
        topProducts={stats.topProducts}
        lowStockProducts={stats.lowStockProducts}
      />
    </div>
  );
}
