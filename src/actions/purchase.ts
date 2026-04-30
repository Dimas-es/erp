"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/src/lib/db";
import PurchaseOrder from "@/src/models/PurchaseOrder";
import Product from "@/src/models/Product";
import StockMovement from "@/src/models/StockMovement";
import Supplier from "@/src/models/Supplier";
import { PurchaseOrderSchema } from "@/src/schemas";
import { requireAuth } from "@/src/lib/rbac";
import { format } from "date-fns";

async function generatePurchaseCode(): Promise<string> {
  const count = await PurchaseOrder.countDocuments();
  const seq = String(count + 1).padStart(4, "0");
  return `PO/${format(new Date(), "yyyy/MM")}/${seq}`;
}

export async function createPurchase(data: unknown) {
  const session = await requireAuth();
  await connectDB();

  const parsed = PurchaseOrderSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supplier = await Supplier.findById(parsed.data.supplierId).lean();
  if (!supplier) return { error: "Supplier tidak ditemukan" };

  const mongoSession = await mongoose.startSession();

  try {
    await mongoSession.withTransaction(async () => {
      const code = await generatePurchaseCode();
      const userId = (session.user as { id: string }).id;
      const userName = session.user?.name ?? "Admin";

      await PurchaseOrder.create(
        [
          {
            code,
            supplierId: parsed.data.supplierId,
            supplierName: supplier.name,
            items: parsed.data.items,
            total: parsed.data.total,
            createdById: userId,
            createdByName: userName,
          },
        ],
        { session: mongoSession }
      );

      for (const item of parsed.data.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.qty } },
          { session: mongoSession }
        );
        await StockMovement.create(
          [
            {
              productId: item.productId,
              productName: item.name,
              productSku: item.sku,
              type: "IN",
              qty: item.qty,
              refType: "PURCHASE",
              refId: new mongoose.Types.ObjectId(),
              refCode: code,
            },
          ],
          { session: mongoSession }
        );
      }
    });
  } finally {
    await mongoSession.endSession();
  }

  revalidatePath("/pembelian");
  revalidatePath("/stok");
  revalidatePath("/");

  return { success: true };
}

export async function getPurchaseOrders(params?: {
  page?: number;
  limit?: number;
}) {
  await connectDB();
  const { page = 1, limit = 20 } = params ?? {};

  const [orders, total] = await Promise.all([
    PurchaseOrder.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PurchaseOrder.countDocuments(),
  ]);

  return {
    orders: orders.map((o) => ({
      ...o,
      _id: o._id.toString(),
      supplierId: o.supplierId.toString(),
      createdById: o.createdById.toString(),
      items: o.items.map((i) => ({
        ...i,
        productId: i.productId.toString(),
      })),
    })),
    total,
    pages: Math.ceil(total / limit),
  };
}
