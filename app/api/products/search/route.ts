import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Product from "@/src/models/Product";
import "@/src/models/Unit";
import "@/src/models/Category";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = { stock: { $gt: 0 } };
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } },
    ];
  }

  const products = await Product.find(query)
    .populate("unitId", "name symbol")
    .limit(20)
    .lean();

  return NextResponse.json(
    products.map((p) => ({
      _id: p._id.toString(),
      sku: p.sku,
      name: p.name,
      sellPrice: p.sellPrice,
      stock: p.stock,
      unit: p.unitId ? ((p.unitId as unknown) as { symbol: string }).symbol : "",
    }))
  );
}
