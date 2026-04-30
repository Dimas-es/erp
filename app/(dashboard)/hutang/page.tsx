import { requireAdmin } from "@/src/lib/rbac";
import { getOpenPayables } from "@/src/actions/purchase";
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
import { SupplierPayForm } from "@/src/components/supplier-pay-form";

export default async function HutangPage() {
  await requireAdmin();
  const { orders } = await getOpenPayables({ limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hutang supplier</h1>
        <p className="text-muted-foreground text-sm">Pembelian dengan sisa pembayaran</p>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{orders.length} transaksi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Tidak ada hutang terbuka</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o._id}>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 rounded">{o.code}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(o.createdAt), "d MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell>{o.supplierName}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(o.total)}</TableCell>
                    <TableCell className="text-right align-top">
                      <div className="font-semibold text-amber-800 tabular-nums">
                        {formatRupiah(o.balanceDue)}
                      </div>
                      <SupplierPayForm purchaseId={o._id} balanceDue={o.balanceDue} />
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
