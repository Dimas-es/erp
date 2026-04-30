"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/src/lib/db";
import PurchaseOrder from "@/src/models/PurchaseOrder";
import Product from "@/src/models/Product";
import StockMovement from "@/src/models/StockMovement";
import Supplier from "@/src/models/Supplier";
import { PurchaseOrderSchema } from "@/src/schemas";
import { requireAuth, getRole } from "@/src/lib/rbac";
import Counter from "@/src/models/Counter";
import { format } from "date-fns";
import type { Session } from "next-auth";

async function generatePurchaseCode(session: mongoose.ClientSession): Promise<string> {
  const now = new Date();
  const key = `po-${format(now, "yyyy-MM")}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", session }
  );
  const seq = String(counter!.seq).padStart(4, "0");
  return `PO/${format(now, "yyyy/MM")}/${seq}`;
}

export async function createPurchase(data: unknown) {
  const session = await requireAuth();
  if (getRole(session as Session) !== "ADMIN") {
    return { error: "Hanya admin yang dapat mencatat pembelian" };
  }
  await connectDB();

  const parsed = PurchaseOrderSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supplier = await Supplier.findById(parsed.data.supplierId).lean();
  if (!supplier) return { error: "Supplier tidak ditemukan" };

  const mongoSession = await mongoose.startSession();
  let purchaseId: string | null = null;
  let codeOut = "";

  try {
    await mongoSession.withTransaction(async () => {
      const code = await generatePurchaseCode(mongoSession);
      codeOut = code;
      const userId = (session.user as { id: string }).id;
      const userName = session.user?.name ?? "Admin";

      const [po] = await PurchaseOrder.create(
        [
          {
            code,
            status: "RECEIVED",
            supplierId: parsed.data.supplierId,
            supplierName: supplier.name,
            items: parsed.data.items,
            total: parsed.data.total,
            apPaidTotal: 0,
            apPayments: [],
            apSettled: false,
            createdById: userId,
            createdByName: userName,
          },
        ],
        { session: mongoSession }
      );
      purchaseId = po._id.toString();
      const pid = po._id as mongoose.Types.ObjectId;

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
              refId: pid,
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
  revalidatePath("/hutang");

  const { writeAuditLog } = await import("@/src/lib/audit");
  await writeAuditLog({
    actorId: (session.user as { id: string }).id,
    actorName: session.user?.name ?? "",
    actorEmail: session.user?.email ?? "",
    action: "PURCHASE_CREATE",
    entityType: "PurchaseOrder",
    entityId: purchaseId!,
    summary: `Pembelian ${codeOut}`,
    metadata: { total: parsed.data.total },
  });

  return { success: true };
}

export async function recordSupplierPayment(purchaseId: string, amount: number, note?: string) {
  const session = await requireAuth();
  if (getRole(session as Session) !== "ADMIN") {
    return { error: "Hanya admin" };
  }
  if (amount <= 0) return { error: "Jumlah tidak valid" };

  await connectDB();
  const po = await PurchaseOrder.findById(purchaseId);
  if (!po) return { error: "Pembelian tidak ditemukan" };

  const owed = po.total - po.apPaidTotal;
  if (owed <= 0) return { error: "Hutang sudah lunas" };
  if (amount > owed) return { error: "Jumlah melebihi sisa hutang" };

  po.apPaidTotal += amount;
  po.apPayments.push({
    amount,
    paidAt: new Date(),
    recordedById: new mongoose.Types.ObjectId((session.user as { id: string }).id),
    recordedByName: session.user?.name ?? "Admin",
    note,
  });
  if (po.apPaidTotal >= po.total) po.apSettled = true;
  await po.save();

  const { writeAuditLog } = await import("@/src/lib/audit");
  await writeAuditLog({
    actorId: (session.user as { id: string }).id,
    actorName: session.user?.name ?? "",
    actorEmail: session.user?.email ?? "",
    action: "SUPPLIER_PAYMENT",
    entityType: "PurchaseOrder",
    entityId: purchaseId,
    summary: `Bayar supplier ${amount}`,
  });

  revalidatePath("/pembelian");
  revalidatePath("/hutang");
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
    orders: orders.map((o) => {
      const apPaidTotal = o.apPaidTotal ?? 0;
      return {
        ...o,
        _id: o._id.toString(),
        supplierId: o.supplierId.toString(),
        createdById: o.createdById.toString(),
        apPaidTotal,
        balanceDue: o.total - apPaidTotal,
        apSettled: o.apSettled ?? false,
        items: o.items.map((i) => ({
          ...i,
          productId: i.productId.toString(),
        })),
      };
    }),
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function getOpenPayables(params?: { page?: number; limit?: number }) {
  const { requireAdmin } = await import("@/src/lib/rbac");
  await requireAdmin();
  await connectDB();
  const { page = 1, limit = 25 } = params ?? {};

  const [orders, total] = await Promise.all([
    PurchaseOrder.find({
      $expr: {
        $lt: [{ $ifNull: ["$apPaidTotal", 0] }, "$total"],
      },
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PurchaseOrder.countDocuments({ apSettled: false }),
  ]);

  return {
    orders: orders.map((o) => {
      const apPaidTotal = o.apPaidTotal ?? 0;
      return {
        ...o,
        _id: o._id.toString(),
        supplierId: o.supplierId.toString(),
        balanceDue: o.total - apPaidTotal,
      };
    }),
    total,
    pages: Math.ceil(total / limit),
  };
}
