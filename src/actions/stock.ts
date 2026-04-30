"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/src/lib/db";
import Product from "@/src/models/Product";
import StockMovement from "@/src/models/StockMovement";
import "@/src/models/Unit";
import "@/src/models/Category";
import { StockAdjustSchema } from "@/src/schemas";
import { requireAdmin } from "@/src/lib/rbac";
import { auth } from "@/src/lib/auth";

export async function getStockList(params?: {
  search?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}) {
  await connectDB();
  const { search, lowStock, page = 1, limit = 25 } = params ?? {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];
  }
  if (lowStock) {
    query.$expr = { $lte: ["$stock", "$minStock"] };
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("categoryId", "name")
      .populate("unitId", "name symbol")
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    products: products.map((p) => ({
      ...p,
      _id: p._id.toString(),
      categoryId: p.categoryId
        ? { ...(p.categoryId as object), _id: (p.categoryId as { _id: { toString(): string } })._id.toString() }
        : null,
      unitId: p.unitId
        ? { ...(p.unitId as object), _id: (p.unitId as { _id: { toString(): string } })._id.toString() }
        : null,
    })),
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function getStockMovements(params?: {
  productId?: string;
  page?: number;
  limit?: number;
}) {
  await connectDB();
  const { productId, page = 1, limit = 25 } = params ?? {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (productId) query.productId = productId;

  const [movements, total] = await Promise.all([
    StockMovement.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    StockMovement.countDocuments(query),
  ]);

  return {
    movements: movements.map((m) => ({
      ...m,
      _id: m._id.toString(),
      productId: m.productId.toString(),
      refId: m.refId.toString(),
    })),
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function getDashboardStats() {
  await connectDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const SaleOrder = (await import("@/src/models/SaleOrder")).default;

  const [todaySales, totalProducts, lowStockCount, salesChart, topProducts, lowStockProducts] =
    await Promise.all([
      SaleOrder.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Product.countDocuments(),
      Product.countDocuments({ $expr: { $lte: ["$stock", "$minStock"] } }),
      SaleOrder.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      SaleOrder.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            sku: { $first: "$items.sku" },
            totalQty: { $sum: "$items.qty" },
            totalRevenue: { $sum: "$items.subtotal" },
          },
        },
        { $sort: { totalQty: -1 } },
        { $limit: 5 },
      ]),
      Product.find({ $expr: { $lte: ["$stock", "$minStock"] } })
        .sort({ stock: 1 })
        .limit(5)
        .lean(),
    ]);

  return {
    todayRevenue: todaySales[0]?.total ?? 0,
    todayTransactions: todaySales[0]?.count ?? 0,
    totalProducts,
    lowStockCount,
    salesChart: salesChart.map((s: { _id: string; total: number; count: number }) => ({
      date: s._id,
      total: s.total,
      count: s.count,
    })),
    topProducts: topProducts.map((p: { _id: unknown; name: string; sku: string; totalQty: number; totalRevenue: number }) => ({
      id: p._id?.toString() ?? "",
      name: p.name,
      sku: p.sku,
      totalQty: p.totalQty,
      totalRevenue: p.totalRevenue,
    })),
    lowStockProducts: (lowStockProducts as Array<{ _id: unknown; name: string; sku: string; stock: number; minStock: number }>).map((p) => ({
      id: p._id?.toString() ?? "",
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      minStock: p.minStock,
    })),
  };
}

export async function createStockAdjustment(data: unknown) {
  await requireAdmin();
  const parsed = StockAdjustSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { productId, qtyDelta, reason, note } = parsed.data;
  await connectDB();

  const mongoSession = await mongoose.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      const product = await Product.findById(productId).session(mongoSession);
      if (!product) throw new Error("Produk tidak ditemukan");

      const qty = Math.abs(qtyDelta);
      if (qtyDelta < 0) {
        if (product.stock < qty) throw new Error("Stok tidak cukup untuk pengurangan");
        await Product.findByIdAndUpdate(
          productId,
          { $inc: { stock: -qty } },
          { session: mongoSession }
        );
      } else {
        await Product.findByIdAndUpdate(
          productId,
          { $inc: { stock: qty } },
          { session: mongoSession }
        );
      }

      const adjId = new mongoose.Types.ObjectId();
      const refCode = `ADJ/${reason}/${Date.now()}`;
      await StockMovement.create(
        [
          {
            productId,
            productName: product.name,
            productSku: product.sku,
            type: qtyDelta > 0 ? "IN" : "OUT",
            qty,
            refType: "ADJUST",
            refId: adjId,
            refCode,
            adjustReason: [reason, note].filter(Boolean).join(" — "),
          },
        ],
        { session: mongoSession }
      );
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Penyesuaian gagal";
    return { error: msg };
  } finally {
    await mongoSession.endSession();
  }

  const s = await auth();
  if (s?.user) {
    const { writeAuditLog } = await import("@/src/lib/audit");
    await writeAuditLog({
      actorId: (s.user as { id: string }).id,
      actorName: s.user.name ?? "",
      actorEmail: s.user.email ?? "",
      action: "STOCK_ADJUST",
      entityType: "Product",
      entityId: productId,
      summary: `Penyesuaian stok ${qtyDelta > 0 ? "+" : ""}${qtyDelta}`,
      metadata: { reason, note },
    });
  }

  revalidatePath("/stok");
  revalidatePath("/");
  return { success: true };
}
