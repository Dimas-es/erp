"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/src/lib/db";
import Customer from "@/src/models/Customer";
import { CustomerSchema } from "@/src/schemas";
import { requireAdmin } from "@/src/lib/rbac";

export async function getCustomers(search?: string) {
  await requireAdmin();
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }
  const rows = await Customer.find(query).sort({ name: 1 }).limit(200).lean();
  return rows.map((c) => ({ ...c, _id: c._id.toString() }));
}

export async function createCustomer(formData: FormData) {
  await requireAdmin();
  await connectDB();
  const parsed = CustomerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await Customer.create(parsed.data);
  revalidatePath("/pelanggan");
  return { success: true };
}

export async function updateCustomer(id: string, formData: FormData) {
  await requireAdmin();
  await connectDB();
  const parsed = CustomerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await Customer.findByIdAndUpdate(id, parsed.data);
  revalidatePath("/pelanggan");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  await requireAdmin();
  await connectDB();
  await Customer.findByIdAndDelete(id);
  revalidatePath("/pelanggan");
  return { success: true };
}

export async function getCustomerSales(customerId: string) {
  await requireAdmin();
  await connectDB();
  const SaleOrder = (await import("@/src/models/SaleOrder")).default;
  const orders = await SaleOrder.find({ customerId })
    .sort({ createdAt: -1 })
    .limit(30)
    .select("invoiceNumber total paymentStatus createdAt")
    .lean();
  return orders.map((o) => ({
    _id: o._id.toString(),
    invoiceNumber: o.invoiceNumber,
    total: o.total,
    paymentStatus: o.paymentStatus ?? "LUNAS",
    createdAt: o.createdAt,
  }));
}
