"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/src/lib/db";
import Category from "@/src/models/Category";
import { CategorySchema } from "@/src/schemas";
import { requireAuth } from "@/src/lib/rbac";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

export async function createCategory(formData: FormData) {
  await requireAuth();
  await connectDB();

  const parsed = CategorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const slug = slugify(parsed.data.name);
  const exists = await Category.findOne({ slug });
  if (exists) return { error: "Kategori dengan nama ini sudah ada" };

  await Category.create({ name: parsed.data.name, slug });
  revalidatePath("/kategori");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAuth();
  await connectDB();

  const parsed = CategorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const slug = slugify(parsed.data.name);
  await Category.findByIdAndUpdate(id, { name: parsed.data.name, slug });
  revalidatePath("/kategori");
  return { success: true };
}

export async function deleteCategory(id: string) {
  await requireAuth();
  await connectDB();
  await Category.findByIdAndDelete(id);
  revalidatePath("/kategori");
  return { success: true };
}

export async function getCategories() {
  await connectDB();
  const cats = await Category.find().sort({ name: 1 }).lean();
  return cats.map((c) => ({ ...c, _id: c._id.toString() }));
}
