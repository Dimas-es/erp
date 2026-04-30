import { getSaleOrders } from "@/src/actions/sale";
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
import { Eye } from "lucide-react";
import { InvoiceSearch } from "@/src/components/invoice-search";

interface SearchParams {
  search?: string;
  from?: string;
  to?: string;
  page?: string;
}

export default async function InvoicePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const { orders, total, pages } = await getSaleOrders({
    search: sp.search,
    from: sp.from,
    to: sp.to,
    page,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoice</h1>
        <p className="text-muted-foreground">Riwayat semua transaksi penjualan</p>
      </div>

      <InvoiceSearch />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {total} invoice ditemukan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Belum ada invoice.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Kasir</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-16 text-center">Aksi</TableHead>
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
                      {format(new Date(o.createdAt), "d MMM yyyy, HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell>
                      {o.customer?.name ? (
                        <span>{o.customer.name}</span>
                      ) : (
                        <Badge variant="secondary">Umum</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {o.cashierName}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatRupiah(o.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/invoice/${o._id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`?page=${p}${sp.search ? `&search=${sp.search}` : ""}${sp.from ? `&from=${sp.from}` : ""}${sp.to ? `&to=${sp.to}` : ""}`}>
                {p}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
