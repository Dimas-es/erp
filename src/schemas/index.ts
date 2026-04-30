import { z } from "zod";

export const CategorySchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  slug: z.string().optional(),
});

export const UnitSchema = z.object({
  name: z.string().min(1, "Nama satuan wajib diisi"),
  symbol: z.string().min(1, "Simbol wajib diisi"),
});

export const SupplierSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
});

export const ProductSchema = z.object({
  sku: z.string().min(2, "SKU minimal 2 karakter"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  unitId: z.string().min(1, "Satuan wajib dipilih"),
  costPrice: z.coerce.number().min(0, "Harga beli tidak boleh negatif"),
  sellPrice: z.coerce.number().min(0, "Harga jual tidak boleh negatif"),
  stock: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(0).default(5),
});

export const SaleItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  qty: z.coerce.number().min(1),
  price: z.coerce.number().min(0),
  subtotal: z.coerce.number().min(0),
});

export const SaleOrderSchema = z.object({
  customer: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  items: z.array(SaleItemSchema).min(1, "Minimal 1 item"),
  subtotal: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0),
  paid: z.coerce.number().min(0),
  change: z.coerce.number(),
});

export const PurchaseItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  qty: z.coerce.number().min(1),
  cost: z.coerce.number().min(0),
  subtotal: z.coerce.number().min(0),
});

export const PurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier wajib dipilih"),
  items: z.array(PurchaseItemSchema).min(1, "Minimal 1 item"),
  total: z.coerce.number().min(0),
});

export type CategoryInput = z.infer<typeof CategorySchema>;
export type UnitInput = z.infer<typeof UnitSchema>;
export type SupplierInput = z.infer<typeof SupplierSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;
export type SaleOrderInput = z.infer<typeof SaleOrderSchema>;
export type PurchaseOrderInput = z.infer<typeof PurchaseOrderSchema>;
