"use server";

import { connectDB } from "@/src/lib/db";
import StoreSettings from "@/src/models/StoreSettings";

export type StoreSettingsDTO = {
  defaultTaxPercent: number;
  maxDiscountPercentKasir: number;
};

export async function getStoreSettings(): Promise<StoreSettingsDTO> {
  await connectDB();
  const doc = await StoreSettings.findById("default").lean();
  return {
    defaultTaxPercent: doc?.defaultTaxPercent ?? 11,
    maxDiscountPercentKasir: doc?.maxDiscountPercentKasir ?? 15,
  };
}

export async function updateStoreSettings(formData: FormData): Promise<void> {
  const { requireAdmin } = await import("@/src/lib/rbac");
  await requireAdmin();
  await connectDB();

  const tax = Number(formData.get("defaultTaxPercent"));
  const maxDisc = Number(formData.get("maxDiscountPercentKasir"));
  if (Number.isNaN(tax) || tax < 0 || tax > 100) {
    return;
  }
  if (Number.isNaN(maxDisc) || maxDisc < 0 || maxDisc > 100) {
    return;
  }

  await StoreSettings.findByIdAndUpdate(
    "default",
    { defaultTaxPercent: tax, maxDiscountPercentKasir: maxDisc },
    { upsert: true, new: true }
  );

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/pengaturan/toko");
  revalidatePath("/pos");
}
