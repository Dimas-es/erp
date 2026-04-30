"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/src/lib/db";
import SaleOrder from "@/src/models/SaleOrder";
import Product from "@/src/models/Product";
import StockMovement from "@/src/models/StockMovement";
import Counter from "@/src/models/Counter";
import { SaleOrderSchema } from "@/src/schemas";
import { requireAuth } from "@/src/lib/rbac";
import { format } from "date-fns";

async function generateInvoiceNumber(
  session: mongoose.ClientSession
): Promise<string> {
  const now = new Date();
  const key = `invoice-${format(now, "yyyy-MM")}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", session }
  );
  const seq = String(counter.seq).padStart(4, "0");
  return `INV/${format(now, "yyyy/MM")}/${seq}`;
}

export async function createSale(data: unknown) {
  const session = await requireAuth();
  await connectDB();

  const parsed = SaleOrderSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const mongoSession = await mongoose.startSession();
  let saleId: string | null = null;

  try {
    await mongoSession.withTransaction(async () => {
      const invoiceNumber = await generateInvoiceNumber(mongoSession);

      for (const item of parsed.data.items) {
        const product = await Product.findById(item.productId).session(mongoSession);
        if (!product) throw new Error(`Produk ${item.name} tidak ditemukan`);
        if (product.stock < item.qty) {
          throw new Error(`Stok ${product.name} tidak cukup (tersisa ${product.stock})`);
        }
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.qty } },
          { session: mongoSession }
        );
        await StockMovement.create(
          [
            {
              productId: item.productId,
              productName: item.name,
              productSku: item.sku,
              type: "OUT",
              qty: item.qty,
              refType: "SALE",
              refId: new mongoose.Types.ObjectId(),
              refCode: invoiceNumber,
            },
          ],
          { session: mongoSession }
        );
      }

      const userId = (session.user as { id: string }).id;
      const userName = session.user?.name ?? "Kasir";

      const [sale] = await SaleOrder.create(
        [
          {
            invoiceNumber,
            customer: parsed.data.customer,
            items: parsed.data.items,
            subtotal: parsed.data.subtotal,
            discount: parsed.data.discount,
            tax: parsed.data.tax,
            total: parsed.data.total,
            paid: parsed.data.paid,
            change: parsed.data.change,
            cashierId: userId,
            cashierName: userName,
          },
        ],
        { session: mongoSession }
      );

      saleId = sale._id.toString();
    });
  } finally {
    await mongoSession.endSession();
  }

  revalidatePath("/invoice");
  revalidatePath("/stok");
  revalidatePath("/");

  return { success: true, id: saleId };
}

export async function getSaleOrders(params?: {
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  await connectDB();
  const { search, from, to, page = 1, limit = 20 } = params ?? {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (search) {
    query.$or = [
      { invoiceNumber: { $regex: search, $options: "i" } },
      { "customer.name": { $regex: search, $options: "i" } },
    ];
  }
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = toDate;
    }
  }

  const [orders, total] = await Promise.all([
    SaleOrder.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    SaleOrder.countDocuments(query),
  ]);

  return {
    orders: orders.map((o) => ({
      ...o,
      _id: o._id.toString(),
      cashierId: o.cashierId.toString(),
      items: o.items.map((i) => ({
        ...i,
        productId: i.productId.toString(),
      })),
    })),
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function getSaleOrderById(id: string) {
  await connectDB();
  const order = await SaleOrder.findById(id).lean();
  if (!order) return null;
  return {
    ...order,
    _id: order._id.toString(),
    cashierId: order.cashierId.toString(),
    items: order.items.map((i) => ({
      ...i,
      productId: i.productId.toString(),
    })),
  };
}
