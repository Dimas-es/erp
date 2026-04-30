import { requireAdmin } from "@/src/lib/rbac";
import { getPurchaseOrders } from "@/src/actions/purchase";
import { getSuppliers } from "@/src/actions/supplier";
import { getProducts } from "@/src/actions/product";
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
import { Badge } from "@/src/components/ui/badge";
import { PurchaseForm } from "@/src/components/purchase-form";

export default async function PembelianPage() {
  await requireAdmin();
  const [{ orders }, suppliers, rawProducts] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getProducts(),
  ]);

  // Map to the shape expected by PurchaseForm
  const products = rawProducts.map((p) => ({
    _id: p._id,
    sku: p.sku,
    name: p.name,
    costPrice: p.costPrice,
    unitId: p.unitId as { symbol: string } | null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pembelian</h1>
          <p className="text-muted-foreground">Penerimaan barang dari supplier</p>
        </div>
        <PurchaseForm suppliers={suppliers} products={products} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Total {orders.length} pembelian</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Belum ada data pembelian.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode PO</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-center">Item</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o._id}>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{o.code}</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(o.createdAt), "d MMM yyyy, HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell className="font-medium">{o.supplierName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{o.items.length} produk</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatRupiah(o.total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {o.createdByName}
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
