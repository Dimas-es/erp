import { getStockList, getStockMovements } from "@/src/actions/stock";
import { formatRupiah } from "@/src/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
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
import { Button } from "@/src/components/ui/button";
import { StockFilter } from "@/src/components/stock-filter";
import { ArrowDown, ArrowUp } from "lucide-react";

interface SearchParams {
  search?: string;
  lowStock?: string;
  view?: string;
  productId?: string;
}

export default async function StokPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const isMovementView = sp.view === "movement";

  const [{ products }, { movements }] = await Promise.all([
    getStockList({
      search: sp.search,
      lowStock: sp.lowStock === "1",
    }),
    isMovementView
      ? getStockMovements({ productId: sp.productId, limit: 50 })
      : Promise.resolve({ movements: [] }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stok</h1>
          <p className="text-muted-foreground">Monitor stok dan riwayat mutasi produk</p>
        </div>
        <div className="flex gap-2">
          <Button variant={!isMovementView ? "default" : "outline"} size="sm" asChild>
            <Link href="/stok">Daftar Stok</Link>
          </Button>
          <Button variant={isMovementView ? "default" : "outline"} size="sm" asChild>
            <Link href="/stok?view=movement">Riwayat Mutasi</Link>
          </Button>
        </div>
      </div>

      <StockFilter defaultSearch={sp.search} defaultLowStock={sp.lowStock === "1"} />

      {!isMovementView ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total {products.length} produk</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Tidak ada produk.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Stok</TableHead>
                    <TableHead className="text-right">Min. Stok</TableHead>
                    <TableHead className="text-right">Nilai Stok</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const cat = p.categoryId as { name: string } | null;
                    const unit = p.unitId as { symbol: string } | null;
                    const isLow = p.stock <= p.minStock;
                    return (
                      <TableRow key={p._id}>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.sku}</code>
                        </TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{cat?.name ?? "-"}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {p.stock} {unit?.symbol}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {p.minStock}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatRupiah(p.stock * p.costPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          {isLow ? (
                            <Badge variant="warning">Menipis</Badge>
                          ) : (
                            <Badge variant="success">Aman</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Riwayat Mutasi Stok</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Belum ada mutasi stok.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Referensi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m._id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(m.createdAt), "d MMM yyyy, HH:mm", { locale: id })}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{m.productName}</p>
                        <p className="text-xs text-muted-foreground">{m.productSku}</p>
                      </TableCell>
                      <TableCell>
                        {m.type === "IN" ? (
                          <Badge variant="success" className="gap-1">
                            <ArrowDown className="h-3 w-3" />
                            Masuk
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1 opacity-80">
                            <ArrowUp className="h-3 w-3" />
                            Keluar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {m.type === "IN" ? "+" : "-"}{m.qty}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">
                          {m.refCode}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
