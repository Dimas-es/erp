"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/src/lib/db";
import Supplier from "@/src/models/Supplier";
import { SupplierSchema } from "@/src/schemas";
import { requireAuth } from "@/src/lib/rbac";

export async function createSupplier(formData: FormData) {
  await requireAuth();
  await connectDB();

  const parsed = SupplierSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await Supplier.create(parsed.data);
  revalidatePath("/supplier");
  return { success: true };
}

export async function updateSupplier(id: string, formData: FormData) {
  await requireAuth();
  await connectDB();

  const parsed = SupplierSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await Supplier.findByIdAndUpdate(id, parsed.data);
  revalidatePath("/supplier");
  return { success: true };
}

export async function deleteSupplier(id: string) {
  await requireAuth();
  await connectDB();
  await Supplier.findByIdAndDelete(id);
  revalidatePath("/supplier");
  return { success: true };
}

export async function getSuppliers() {
  await connectDB();
  const suppliers = await Supplier.find().sort({ name: 1 }).lean();
  return suppliers.map((s) => ({ ...s, _id: s._id.toString() }));
}
