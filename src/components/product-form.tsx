"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { createProduct, updateProduct, deleteProduct } from "@/src/actions/product";
import { DeleteButton } from "@/src/components/crud-dialog";

interface Category { _id: string; name: string }
interface Unit { _id: string; name: string; symbol: string }
interface Product {
  _id: string;
  sku: string;
  name: string;
  categoryId: { _id: string; name: string } | null;
  unitId: { _id: string; name: string; symbol: string } | null;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
}

interface ProductFormProps {
  categories: Category[];
  units: Unit[];
  product?: Product;
  mode?: "create" | "edit";
}

export function ProductForm({ categories, units, product, mode = "create" }: ProductFormProps) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(product?.categoryId?._id ?? "");
  const [unitId, setUnitId] = useState(product?.unitId?._id ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("categoryId", categoryId);
    formData.set("unitId", unitId);

    startTransition(async () => {
      const result = mode === "create"
        ? await createProduct(formData)
        : await updateProduct(product!._id, formData);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(mode === "create" ? "Produk berhasil ditambahkan" : "Produk berhasil diperbarui");
        setOpen(false);
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {mode === "create" ? (
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Produk
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Tambah Produk" : "Edit Produk"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" placeholder="BRG-001" defaultValue={product?.sku} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk</Label>
                <Input id="name" name="name" placeholder="Semen Portland 50kg" defaultValue={product?.name} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Satuan</Label>
                <Select value={unitId} onValueChange={setUnitId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih satuan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u._id} value={u._id}>{u.name} ({u.symbol})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Harga Beli (Rp)</Label>
                <Input id="costPrice" name="costPrice" type="number" min="0" defaultValue={product?.costPrice} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellPrice">Harga Jual (Rp)</Label>
                <Input id="sellPrice" name="sellPrice" type="number" min="0" defaultValue={product?.sellPrice} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stok Awal</Label>
                <Input id="stock" name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Stok Minimum</Label>
                <Input id="minStock" name="minStock" type="number" min="0" defaultValue={product?.minStock ?? 5} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isPending || !categoryId || !unitId}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {mode === "edit" && product && (
        <DeleteButton
          label={product.name}
          onDelete={() => deleteProduct(product._id)}
        />
      )}
    </div>
  );
}
