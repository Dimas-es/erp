"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import { formatRupiah } from "@/src/lib/utils";
import { createPurchase } from "@/src/actions/purchase";

interface Supplier { _id: string; name: string }
interface Product {
  _id: string;
  sku: string;
  name: string;
  costPrice: number;
  unitId: { symbol: string } | null;
}

interface PurchaseItem {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  cost: number;
  subtotal: number;
  unit: string;
}

interface PurchaseFormProps {
  suppliers: Supplier[];
  products: Product[];
}

export function PurchaseForm({ suppliers, products }: PurchaseFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isPending, startTransition] = useTransition();

  const addItem = () => {
    const product = products.find((p) => p._id === selectedProductId);
    if (!product) return;
    if (items.find((i) => i.productId === product._id)) {
      toast.error("Produk sudah ada di daftar");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        qty: 1,
        cost: product.costPrice,
        subtotal: product.costPrice,
        unit: (product.unitId as { symbol: string } | null)?.symbol ?? "",
      },
    ]);
    setSelectedProductId("");
  };

  const updateItem = (idx: number, field: "qty" | "cost", value: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        updated.subtotal = updated.qty * updated.cost;
        return updated;
      })
    );
  };

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  const handleSubmit = () => {
    if (!supplierId) return toast.error("Pilih supplier terlebih dahulu");
    if (items.length === 0) return toast.error("Tambahkan minimal 1 produk");

    startTransition(async () => {
      const result = await createPurchase({ supplierId, items, total });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pembelian berhasil disimpan. Stok sudah diperbarui.");
        setOpen(false);
        setSupplierId("");
        setItems([]);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Buat Pembelian
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Pembelian Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add product */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk untuk ditambah..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.sku} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" onClick={addItem} disabled={!selectedProductId}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Items table */}
          {items.length > 0 && (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Produk</th>
                    <th className="px-3 py-2 text-center font-medium w-24">Qty</th>
                    <th className="px-3 py-2 text-center font-medium w-36">Harga Beli</th>
                    <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                    <th className="px-2 py-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateItem(idx, "qty", Number(e.target.value) || 1)}
                          className="h-8 text-center text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="0"
                          value={item.cost}
                          onChange={(e) => updateItem(idx, "cost", Number(e.target.value) || 0)}
                          className="h-8 text-right text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatRupiah(item.subtotal)}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30">
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td>
                    <td className="px-3 py-2 text-right font-bold">{formatRupiah(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Pembelian
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
