import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/db";
import PurchaseOrder from "@/src/models/PurchaseOrder";
import { format } from "date-fns";
import { getRole } from "@/src/lib/rbac";
import type { Session } from "next-auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || getRole(session as Session) !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const orders = await PurchaseOrder.find(query).sort({ createdAt: -1 }).lean();

  const rows = [
    ["Kode PO", "Tanggal", "Supplier", "Total", "Dibayar", "Sisa Hutang", "Status"].join(","),
    ...orders.map((o) => {
      const paid = o.apPaidTotal ?? 0;
      const due = o.total - paid;
      const status = due <= 0 ? "LUNAS" : "HUTANG";
      return [
        o.code,
        format(new Date(o.createdAt), "yyyy-MM-dd HH:mm"),
        o.supplierName,
        o.total,
        paid,
        Math.max(0, due),
        status,
      ].join(",");
    }),
  ];

  const csv = rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-pembelian-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
