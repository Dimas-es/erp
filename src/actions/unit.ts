"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/src/lib/db";
import Unit from "@/src/models/Unit";
import { UnitSchema } from "@/src/schemas";
import { requireAdmin } from "@/src/lib/rbac";

export async function createUnit(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const parsed = UnitSchema.safeParse({
    name: formData.get("name"),
    symbol: formData.get("symbol"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await Unit.create(parsed.data);
  revalidatePath("/satuan");
  return { success: true };
}

export async function updateUnit(id: string, formData: FormData) {
  await requireAdmin();
  await connectDB();

  const parsed = UnitSchema.safeParse({
    name: formData.get("name"),
    symbol: formData.get("symbol"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await Unit.findByIdAndUpdate(id, parsed.data);
  revalidatePath("/satuan");
  return { success: true };
}

export async function deleteUnit(id: string) {
  await requireAdmin();
  await connectDB();
  await Unit.findByIdAndDelete(id);
  revalidatePath("/satuan");
  return { success: true };
}

export async function getUnits() {
  await connectDB();
  const units = await Unit.find().sort({ name: 1 }).lean();
  return units.map((u) => ({ ...u, _id: u._id.toString() }));
}
