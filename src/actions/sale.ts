"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/src/lib/db";
import SaleOrder from "@/src/models/SaleOrder";
import Product from "@/src/models/Product";
import StockMovement from "@/src/models/StockMovement";
import Counter from "@/src/models/Counter";
import CashShift from "@/src/models/CashShift";
import Customer from "@/src/models/Customer";
import { SaleOrderSchema } from "@/src/schemas";
import { requireAuth, getRole } from "@/src/lib/rbac";
import { getStoreSettings } from "@/src/actions/settings";
import { format } from "date-fns";
import type { Session } from "next-auth";
import { invoiceCounterKey } from "@/src/lib/invoice-key";

async function generateInvoiceNumber(
  session: mongoose.ClientSession
): Promise<string> {
  const now = new Date();
  const key = invoiceCounterKey(now);
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", session }
  );
  const seq = String(counter!.seq).padStart(4, "0");
  return `INV/${format(now, "yyyy/MM")}/${seq}`;
}

export async function createSale(data: unknown) {
  const authSession = await requireAuth();
  await connectDB();

  const parsed = SaleOrderSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const settings = await getStoreSettings();
  const role = getRole(authSession as Session);
  const userId = (authSession.user as { id: string }).id;
  const userName = authSession.user?.name ?? "Kasir";

  let shiftId: mongoose.Types.ObjectId | undefined;
  if (role === "KASIR") {
    const open = await CashShift.findOne({ cashierId: userId, status: "OPEN" });
    if (!open) return { error: "Buka shift kasir terlebih dahulu di menu Kas & Shift" };
    shiftId = open._id as mongoose.Types.ObjectId;
  }

  const { subtotal, discount, items } = parsed.data;
  const taxableBase = Math.max(0, subtotal - discount);
  if (role === "KASIR") {
    const maxDisc = subtotal * (settings.maxDiscountPercentKasir / 100);
    if (discount > maxDisc + 1e-9) {
      return { error: `Diskon melebihi batas ${settings.maxDiscountPercentKasir}% untuk kasir` };
    }
  }

  const tax = Math.round((taxableBase * settings.defaultTaxPercent) / 100);
  const total = taxableBase + tax;

  const paid = parsed.data.paid;
  if (paid < 0) return { error: "Jumlah bayar tidak valid" };

  let paymentStatus: "LUNAS" | "BELUM_LUNAS";
  let change: number;
  let balanceDue: number;

  if (paid >= total) {
    paymentStatus = "LUNAS";
    change = paid - total;
    balanceDue = 0;
  } else if (paid < total && total > 0) {
    paymentStatus = "BELUM_LUNAS";
    change = 0;
    balanceDue = total - paid;
  } else {
    paymentStatus = "LUNAS";
    change = 0;
    balanceDue = 0;
  }

  let customerId: mongoose.Types.ObjectId | undefined;
  if (parsed.data.customerId) {
    const c = await Customer.findById(parsed.data.customerId).lean();
    if (!c) return { error: "Pelanggan tidak ditemukan" };
    customerId = c._id as mongoose.Types.ObjectId;
  }

  let dueDate: Date | undefined;
  if (parsed.data.dueDate) {
    const d = new Date(parsed.data.dueDate);
    if (!Number.isNaN(d.getTime())) dueDate = d;
  }

  const mongoSession = await mongoose.startSession();
  let saleId: string | null = null;
  let createdInvoiceNumber = "";

  try {
    await mongoSession.withTransaction(async () => {
      for (const item of items) {
        const product = await Product.findById(item.productId).session(mongoSession);
        if (!product) throw new Error(`Produk ${item.name} tidak ditemukan`);
        if (product.stock < item.qty) {
          throw new Error(`Stok ${product.name} tidak cukup (tersisa ${product.stock})`);
        }
      }

      const invoiceNumber = await generateInvoiceNumber(mongoSession);
      createdInvoiceNumber = invoiceNumber;

      const [sale] = await SaleOrder.create(
        [
          {
            invoiceNumber,
            customerId,
            customer: parsed.data.customer,
            items,
            subtotal,
            discount,
            tax,
            total,
            paid,
            change,
            paymentStatus,
            balanceDue,
            dueDate,
            payments: [],
            cashierId: userId,
            cashierName: userName,
            shiftId,
          },
        ],
        { session: mongoSession }
      );

      const sid = sale._id as mongoose.Types.ObjectId;

      for (const item of items) {
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
              refId: sid,
              refCode: invoiceNumber,
            },
          ],
          { session: mongoSession }
        );
      }

      saleId = sale._id.toString();
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Transaksi gagal";
    return { error: msg };
  } finally {
    await mongoSession.endSession();
  }

  revalidatePath("/invoice");
  revalidatePath("/stok");
  revalidatePath("/");
  revalidatePath("/piutang");

  const { writeAuditLog } = await import("@/src/lib/audit");
  await writeAuditLog({
    actorId: userId,
    actorName: userName,
    actorEmail: authSession.user?.email ?? "",
    action: "SALE_CREATE",
    entityType: "SaleOrder",
    entityId: saleId!,
    summary: `Penjualan ${paymentStatus === "LUNAS" ? "lunas" : "kredit"}`,
    metadata: { total, invoiceNumber: createdInvoiceNumber },
  });

  return { success: true, id: saleId };
}

export async function recordSalePayment(saleId: string, amount: number, note?: string) {
  const authSession = await requireAuth();
  const role = getRole(authSession as Session);
  if (role !== "ADMIN") return { error: "Hanya admin yang dapat mencatat pelunasan" };
  if (amount <= 0) return { error: "Jumlah tidak valid" };

  await connectDB();
  const sale = await SaleOrder.findById(saleId);
  if (!sale) return { error: "Invoice tidak ditemukan" };
  if (sale.paymentStatus === "LUNAS") return { error: "Sudah lunas" };

  const remaining = sale.balanceDue;
  if (amount > remaining) return { error: "Jumlah melebihi sisa piutang" };

  sale.balanceDue = remaining - amount;
  sale.payments.push({
    amount,
    paidAt: new Date(),
    recordedById: new mongoose.Types.ObjectId((authSession.user as { id: string }).id),
    recordedByName: authSession.user?.name ?? "Admin",
    note,
  });

  if (sale.balanceDue <= 0) {
    sale.paymentStatus = "LUNAS";
    sale.balanceDue = 0;
  }

  await sale.save();

  const { writeAuditLog } = await import("@/src/lib/audit");
  await writeAuditLog({
    actorId: (authSession.user as { id: string }).id,
    actorName: authSession.user?.name ?? "",
    actorEmail: authSession.user?.email ?? "",
    action: "SALE_PAYMENT",
    entityType: "SaleOrder",
    entityId: saleId,
    summary: `Pelunasan piutang ${amount}`,
  });

  revalidatePath("/invoice");
  revalidatePath("/piutang");
  return { success: true };
}

export async function getReceivables(params?: { page?: number; limit?: number }) {
  const { requireAdmin } = await import("@/src/lib/rbac");
  await requireAdmin();
  await connectDB();
  const { page = 1, limit = 25 } = params ?? {};
  const [orders, total] = await Promise.all([
    SaleOrder.find({ paymentStatus: "BELUM_LUNAS" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    SaleOrder.countDocuments({ paymentStatus: "BELUM_LUNAS" }),
  ]);

  return {
    orders: orders.map((o) => ({
      ...o,
      _id: o._id.toString(),
      cashierId: o.cashierId.toString(),
      customerId: o.customerId?.toString(),
      shiftId: o.shiftId?.toString(),
    })),
    total,
    pages: Math.ceil(total / limit),
  };
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
      customerId: o.customerId?.toString(),
      shiftId: o.shiftId?.toString(),
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
    customerId: order.customerId?.toString(),
    shiftId: order.shiftId?.toString(),
    items: order.items.map((i) => ({
      ...i,
      productId: i.productId.toString(),
    })),
  };
}
