import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import SaleOrder from "@/src/models/SaleOrder";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  await connectDB();

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = toDate;
    }
  }

  const orders = await SaleOrder.find(query).sort({ createdAt: -1 }).lean();

  const rows = [
    ["No. Invoice", "Tanggal", "Pelanggan", "Kasir", "Subtotal", "Diskon", "Pajak", "Total", "Bayar", "Kembalian"].join(","),
    ...orders.map((o) =>
      [
        o.invoiceNumber,
        format(new Date(o.createdAt), "yyyy-MM-dd HH:mm"),
        o.customer?.name ?? "Umum",
        o.cashierName,
        o.subtotal,
        o.discount,
        o.tax,
        o.total,
        o.paid,
        o.change,
      ].join(",")
    ),
  ];

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-penjualan-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
