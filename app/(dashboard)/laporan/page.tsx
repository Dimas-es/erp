import { requireAdmin } from "@/src/lib/rbac";
import { getSaleOrders } from "@/src/actions/sale";
import { formatRupiah } from "@/src/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/src/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { LaporanFilter } from "@/src/components/laporan-filter";
import { Button } from "@/src/components/ui/button";

interface SearchParams {
  from?: string;
  to?: string;
}

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const { orders } = await getSaleOrders({
    from: sp.from,
    to: sp.to,
    limit: 200,
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalTransactions = orders.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Penjualan</h1>
          <p className="text-muted-foreground">Analisis penjualan berdasarkan periode</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`/api/reports/sales?${sp.from ? `from=${sp.from}&` : ""}${sp.to ? `to=${sp.to}` : ""}`}
            download={`laporan-penjualan-${format(new Date(), "yyyy-MM-dd")}.csv`}
          >
            Export CSV
          </a>
        </Button>
      </div>

      <LaporanFilter defaultFrom={sp.from} defaultTo={sp.to} />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRupiah(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Jumlah Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTransactions}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{totalTransactions} transaksi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Belum ada data untuk periode ini.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Kasir</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Diskon</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o._id}>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {o.invoiceNumber}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(o.createdAt), "d MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {o.customer?.name ?? "Umum"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {o.cashierName}
                    </TableCell>
                    <TableCell className="text-right">{formatRupiah(o.subtotal)}</TableCell>
                    <TableCell className="text-right text-red-600">
                      {o.discount > 0 ? `- ${formatRupiah(o.discount)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatRupiah(o.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">{formatRupiah(totalRevenue)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
