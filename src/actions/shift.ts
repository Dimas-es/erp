"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/src/lib/db";
import CashShift from "@/src/models/CashShift";
import SaleOrder from "@/src/models/SaleOrder";
import { requireAuth } from "@/src/lib/rbac";
import { getRole } from "@/src/lib/rbac";
import type { Session } from "next-auth";

export async function getOpenShiftForCashier() {
  const session = await requireAuth();
  const userId = (session.user as { id: string }).id;
  await connectDB();
  const shift = await CashShift.findOne({
    cashierId: userId,
    status: "OPEN",
  }).lean();
  if (!shift) return null;
  return { _id: shift._id.toString(), openedAt: shift.openedAt, openingFloat: shift.openingFloat };
}

export async function openShift(openingFloat: number) {
  const session = await requireAuth();
  const role = getRole(session as Session);
  if (role !== "KASIR" && role !== "ADMIN") {
    return { error: "Tidak diizinkan" };
  }
  if (openingFloat < 0 || !Number.isFinite(openingFloat)) {
    return { error: "Saldo awal tidak valid" };
  }

  await connectDB();
  const userId = (session.user as { id: string }).id;
  const existing = await CashShift.findOne({ cashierId: userId, status: "OPEN" });
  if (existing) return { error: "Shift masih terbuka. Tutup dulu." };

  await CashShift.create({
    cashierId: userId,
    cashierName: session.user?.name ?? "Kasir",
    openingFloat,
    openedAt: new Date(),
    status: "OPEN",
  });

  revalidatePath("/pos");
  revalidatePath("/kas");
  return { success: true };
}

export async function closeShift(shiftId: string, closingCounted: number, note?: string) {
  const session = await requireAuth();
  const userId = (session.user as { id: string }).id;
  await connectDB();

  const shift = await CashShift.findOne({
    _id: shiftId,
    cashierId: userId,
    status: "OPEN",
  });
  if (!shift) return { error: "Shift tidak ditemukan atau sudah ditutup" };

  const agg = await SaleOrder.aggregate([
    {
      $match: {
        shiftId: new mongoose.Types.ObjectId(shiftId),
      },
    },
    {
      $group: {
        _id: null,
        netCash: { $sum: { $subtract: ["$paid", "$change"] } },
      },
    },
  ]);
  const netCash = agg[0]?.netCash ?? 0;
  const expectedCash = shift.openingFloat + netCash;
  const difference = closingCounted - expectedCash;

  shift.closedAt = new Date();
  shift.closingCounted = closingCounted;
  shift.expectedCash = expectedCash;
  shift.difference = difference;
  shift.status = "CLOSED";
  shift.note = note ?? shift.note;
  await shift.save();

  revalidatePath("/pos");
  revalidatePath("/kas");
  return { success: true, expectedCash, difference };
}

export async function getShiftHistory(params?: { page?: number; limit?: number }) {
  const session = await requireAuth();
  await connectDB();
  const role = getRole(session as Session);
  const { page = 1, limit = 20 } = params ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (role === "KASIR") {
    query.cashierId = (session.user as { id: string }).id;
  }

  const [shifts, total] = await Promise.all([
    CashShift.find(query)
      .sort({ openedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CashShift.countDocuments(query),
  ]);

  return {
    shifts: shifts.map((s) => ({
      _id: s._id.toString(),
      cashierName: s.cashierName,
      openingFloat: s.openingFloat,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      closingCounted: s.closingCounted,
      expectedCash: s.expectedCash,
      difference: s.difference,
      status: s.status,
      note: s.note,
    })),
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function getShiftCashReport(shiftId: string) {
  const session = await requireAuth();
  await connectDB();
  const userId = (session.user as { id: string }).id;
  const role = getRole(session as Session);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = { _id: shiftId };
  if (role === "KASIR") q.cashierId = userId;

  const shift = await CashShift.findOne(q).lean();
  if (!shift) return null;

  const sales = await SaleOrder.find({ shiftId: shift._id })
    .sort({ createdAt: -1 })
    .select("invoiceNumber total paid change paymentStatus createdAt")
    .lean();

  return {
    shift: {
      _id: shift._id.toString(),
      cashierName: shift.cashierName,
      openingFloat: shift.openingFloat,
      status: shift.status,
    },
    sales: sales.map((x) => ({
      invoiceNumber: x.invoiceNumber,
      total: x.total,
      paid: x.paid,
      change: x.change,
      net: x.paid - x.change,
      paymentStatus: x.paymentStatus,
      createdAt: x.createdAt,
    })),
  };
}
