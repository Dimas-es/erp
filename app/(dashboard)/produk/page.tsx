import { requireAdmin } from "@/src/lib/rbac";
import { getProducts } from "@/src/actions/product";
import { getCategories } from "@/src/actions/category";
import { getUnits } from "@/src/actions/unit";
import { formatRupiah } from "@/src/lib/utils";
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
import { ProductForm } from "@/src/components/product-form";

export default async function ProdukPage() {
  await requireAdmin();
  const [products, categories, units] = await Promise.all([
    getProducts(),
    getCategories(),
    getUnits(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produk</h1>
          <p className="text-muted-foreground">Kelola katalog produk toko</p>
        </div>
        <ProductForm categories={categories} units={units} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Total {products.length} produk</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Belum ada produk. Tambahkan produk pertama.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const cat = p.categoryId as { name: string } | null;
                  const unit = p.unitId as { name: string; symbol: string } | null;
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
                      <TableCell className="text-muted-foreground">
                        {unit?.symbol ?? "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatRupiah(p.sellPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={isLow ? "text-yellow-600 font-semibold" : ""}>
                          {p.stock}
                          {isLow && " ⚠"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <ProductForm
                          categories={categories}
                          units={units}
                          product={{
                            ...p,
                            categoryId: p.categoryId as { _id: string; name: string } | null,
                            unitId: p.unitId as { _id: string; name: string; symbol: string } | null,
                          }}
                          mode="edit"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
