"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { formatRupiah } from "@/src/lib/utils";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { ShoppingCart, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface SalesChartItem {
  date: string;
  total: number;
  count: number;
}

interface TopProduct {
  id: string;
  name: string;
  sku: string;
  totalQty: number;
  totalRevenue: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
}

interface Props {
  salesChart: SalesChartItem[];
  topProducts: TopProduct[];
  lowStockProducts?: LowStockProduct[];
}

const CHART_COLORS = [
  "hsl(237 64% 58%)",
  "hsl(38 92% 50%)",
  "hsl(142 71% 45%)",
  "hsl(199 89% 48%)",
  "hsl(0 84% 60%)",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card px-3 py-2 shadow-lg text-sm">
        <p className="font-medium text-foreground mb-1">{label}</p>
        <p className="text-muted-foreground">
          Penjualan:{" "}
          <span className="font-semibold text-foreground">
            {formatRupiah(payload[0]?.value ?? 0)}
          </span>
        </p>
        <p className="text-muted-foreground">
          Transaksi:{" "}
          <span className="font-semibold text-foreground">
            {payload[0]?.payload?.count ?? 0}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export function DashboardCharts({ salesChart, topProducts, lowStockProducts = [] }: Props) {
  const chartData = salesChart.map((s) => ({
    ...s,
    label: format(parseISO(s.date), "d MMM", { locale: id }),
  }));

  const maxQty = Math.max(...topProducts.map((p) => p.totalQty), 1);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Area Chart - takes 2 cols */}
      <Card className="lg:col-span-2 border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Penjualan 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              {/* gradient defined via inline style on Area */}
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) =>
                  v >= 1_000_000 ? `${v / 1_000_000}jt` : v >= 1000 ? `${v / 1000}rb` : `${v}`
                }
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(237, 64%, 58%)"
                strokeWidth={2.5}
                fill="hsl(237, 64%, 58%)"
                fillOpacity={0.12}
                dot={{ r: 4, fill: "hsl(237, 64%, 58%)", strokeWidth: 2, stroke: "white" }}
                activeDot={{ r: 6, fill: "hsl(38, 92%, 50%)", stroke: "white", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top 5 Produk Terlaris</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada data penjualan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0 text-white"
                        style={{ background: CHART_COLORS[i] }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium truncate">{p.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {p.totalQty} unit
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.round((p.totalQty / maxQty) * 100)}%`,
                        background: CHART_COLORS[i],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Panel */}
      {lowStockProducts.length > 0 && (
        <Card className="lg:col-span-3 border-0 shadow-sm border-l-4" style={{ borderLeftColor: "hsl(38 92% 50%)" }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" style={{ color: "hsl(38 92% 50%)" }} />
              <CardTitle className="text-base font-semibold">Stok Kritis</CardTitle>
              <Badge variant="secondary" className="ml-1">
                {lowStockProducts.length} produk
              </Badge>
            </div>
            <Link
              href="/stok?lowStock=true"
              className="text-xs font-medium hover:underline"
              style={{ color: "hsl(237 64% 58%)" }}
            >
              Lihat semua →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 border"
                  style={{ background: "hsl(38 92% 50% / 0.05)", borderColor: "hsl(38 92% 50% / 0.2)" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-bold" style={{ color: "hsl(0 84% 60%)" }}>
                      {p.stock}
                    </p>
                    <p className="text-[10px] text-muted-foreground">min {p.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
