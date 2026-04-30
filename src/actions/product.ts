"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/src/lib/db";
import Product from "@/src/models/Product";
import "@/src/models/Unit";
import "@/src/models/Category";
import { ProductSchema } from "@/src/schemas";
import { requireAdmin } from "@/src/lib/rbac";
import { auth } from "@/src/lib/auth";

export async function createProduct(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const parsed = ProductSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    unitId: formData.get("unitId"),
    costPrice: formData.get("costPrice"),
    sellPrice: formData.get("sellPrice"),
    stock: formData.get("stock"),
    minStock: formData.get("minStock"),
    barcode: formData.get("barcode") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const exists = await Product.findOne({ sku: parsed.data.sku.toUpperCase() });
  if (exists) return { error: "SKU sudah digunakan" };

  const bc = parsed.data.barcode?.trim();
  if (bc) {
    const dup = await Product.findOne({ barcode: bc });
    if (dup) return { error: "Barcode sudah dipakai produk lain" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, unknown> = {
    ...parsed.data,
    sku: parsed.data.sku.toUpperCase(),
  };
  if (bc) payload.barcode = bc;

  const doc = await Product.create(payload);

  const s = await auth();
  if (s?.user) {
    const { writeAuditLog } = await import("@/src/lib/audit");
    await writeAuditLog({
      actorId: (s.user as { id: string }).id,
      actorName: s.user.name ?? "",
      actorEmail: s.user.email ?? "",
      action: "PRODUCT_CREATE",
      entityType: "Product",
      entityId: doc._id.toString(),
      summary: `Buat produk ${parsed.data.sku}`,
    });
  }

  revalidatePath("/produk");
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  await connectDB();

  const parsed = ProductSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    unitId: formData.get("unitId"),
    costPrice: formData.get("costPrice"),
    sellPrice: formData.get("sellPrice"),
    stock: formData.get("stock"),
    minStock: formData.get("minStock"),
    barcode: formData.get("barcode") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const exists = await Product.findOne({
    sku: parsed.data.sku.toUpperCase(),
    _id: { $ne: id },
  });
  if (exists) return { error: "SKU sudah digunakan produk lain" };

  const bc = parsed.data.barcode?.trim();
  if (bc) {
    const dup = await Product.findOne({ barcode: bc, _id: { $ne: id } });
    if (dup) return { error: "Barcode sudah dipakai produk lain" };
  }

  const prev = await Product.findById(id).lean();
  const updateFields = {
    sku: parsed.data.sku.toUpperCase(),
    name: parsed.data.name,
    categoryId: parsed.data.categoryId,
    unitId: parsed.data.unitId,
    costPrice: parsed.data.costPrice,
    sellPrice: parsed.data.sellPrice,
    stock: parsed.data.stock,
    minStock: parsed.data.minStock,
  };
  if (bc) {
    await Product.findByIdAndUpdate(id, { ...updateFields, barcode: bc });
  } else {
    await Product.findByIdAndUpdate(id, { $set: updateFields, $unset: { barcode: 1 } });
  }

  const s = await auth();
  if (s?.user) {
    const { writeAuditLog } = await import("@/src/lib/audit");
    await writeAuditLog({
      actorId: (s.user as { id: string }).id,
      actorName: s.user.name ?? "",
      actorEmail: s.user.email ?? "",
      action: "PRODUCT_UPDATE",
      entityType: "Product",
      entityId: id,
      summary: `Update produk ${parsed.data.sku}`,
      metadata: {
        costPriceBefore: prev?.costPrice,
        costPriceAfter: parsed.data.costPrice,
        sellPriceBefore: prev?.sellPrice,
        sellPriceAfter: parsed.data.sellPrice,
      },
    });
  }

  revalidatePath("/produk");
  return { success: true };
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await connectDB();
  const prev = await Product.findByIdAndDelete(id).lean();

  const s = await auth();
  if (s?.user && prev) {
    const { writeAuditLog } = await import("@/src/lib/audit");
    await writeAuditLog({
      actorId: (s.user as { id: string }).id,
      actorName: s.user.name ?? "",
      actorEmail: s.user.email ?? "",
      action: "PRODUCT_DELETE",
      entityType: "Product",
      entityId: id,
      summary: `Hapus produk ${prev.sku}`,
    });
  }

  revalidatePath("/produk");
  return { success: true };
}

export async function getProducts(search?: string) {
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
    ];
  }
  const products = await Product.find(query)
    .populate("categoryId", "name")
    .populate("unitId", "name symbol")
    .sort({ name: 1 })
    .lean();

  return products.map((p) => ({
    ...p,
    _id: p._id.toString(),
    categoryId: p.categoryId
      ? { ...(p.categoryId as object), _id: (p.categoryId as { _id: { toString(): string } })._id.toString() }
      : null,
    unitId: p.unitId
      ? { ...(p.unitId as object), _id: (p.unitId as { _id: { toString(): string } })._id.toString() }
      : null,
  }));
}
