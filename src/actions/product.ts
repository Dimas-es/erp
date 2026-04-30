"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/src/lib/db";
import Product from "@/src/models/Product";
import "@/src/models/Unit";
import "@/src/models/Category";
import { ProductSchema } from "@/src/schemas";
import { requireAuth } from "@/src/lib/rbac";

export async function createProduct(formData: FormData) {
  await requireAuth();
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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const exists = await Product.findOne({ sku: parsed.data.sku.toUpperCase() });
  if (exists) return { error: "SKU sudah digunakan" };

  await Product.create(parsed.data);
  revalidatePath("/produk");
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAuth();
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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const exists = await Product.findOne({
    sku: parsed.data.sku.toUpperCase(),
    _id: { $ne: id },
  });
  if (exists) return { error: "SKU sudah digunakan produk lain" };

  await Product.findByIdAndUpdate(id, parsed.data);
  revalidatePath("/produk");
  return { success: true };
}

export async function deleteProduct(id: string) {
  await requireAuth();
  await connectDB();
  await Product.findByIdAndDelete(id);
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
