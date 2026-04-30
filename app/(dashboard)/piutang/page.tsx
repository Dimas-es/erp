import { requireAdmin } from "@/src/lib/rbac";
import { getReceivables } from "@/src/actions/sale";
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
} from "@/src/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export default async function PiutangPage() {
  await requireAdmin();
  const { orders } = await getReceivables({ limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Piutang</h1>
        <p className="text-muted-foreground text-sm">Penjualan kredit belum lunas</p>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{orders.length} faktur</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Tidak ada piutang</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o._id}>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 rounded">{o.invoiceNumber}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(o.createdAt), "d MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell>{o.customer?.name ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(o.total)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-amber-700">
                      {formatRupiah(o.balanceDue ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/invoice/${o._id}`}>Detail</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
