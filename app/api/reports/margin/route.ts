import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/db";
import Product from "@/src/models/Product";
import { format } from "date-fns";
import { getRole } from "@/src/lib/rbac";
import type { Session } from "next-auth";

/** Margin kasar: (harga jual - harga beli) per unit × stok saat ini (indikator, bukan laba riil). */
export async function GET() {
  const session = await auth();
  if (!session?.user || getRole(session as Session) !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const products = await Product.find().sort({ name: 1 }).lean();

  const rows = [
    ["SKU", "Nama", "Harga Beli", "Harga Jual", "Margin/unit", "Stok", "Nilai Margin Stok"].join(","),
    ...products.map((p) => {
      const marginUnit = p.sellPrice - p.costPrice;
      const marginStock = marginUnit * p.stock;
      return [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        p.costPrice,
        p.sellPrice,
        marginUnit,
        p.stock,
        marginStock,
      ].join(",");
    }),
  ];

  const csv = rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="margin-produk-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
