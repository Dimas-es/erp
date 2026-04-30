"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { createStockAdjustment } from "@/src/actions/stock";
import { SlidersHorizontal } from "lucide-react";

const REASONS = [
  { value: "RUSAK", label: "Rusak" },
  { value: "HILANG", label: "Hilang" },
  { value: "INVENTARIS", label: "Inventaris" },
  { value: "LAINNYA", label: "Lainnya" },
];

export function StockAdjustDialog({
  products,
}: {
  products: { _id: string; sku: string; name: string; stock: number }[];
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [qtyDelta, setQtyDelta] = useState("");
  const [reason, setReason] = useState("INVENTARIS");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Penyesuaian stok
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Penyesuaian stok (admin)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Produk</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.sku} — {p.name} (stok {p.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Perubahan qty (+tambah / -kurang)</Label>
            <Input
              type="number"
              placeholder="-5 atau 10"
              value={qtyDelta}
              onChange={(e) => setQtyDelta(e.target.value)}
            />
          </div>
          <div>
            <Label>Alasan</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Catatan</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() => {
              const q = Number(qtyDelta);
              if (!productId) return toast.error("Pilih produk");
              if (!q || q === 0) return toast.error("Qty tidak valid");
              startTransition(async () => {
                const r = await createStockAdjustment({
                  productId,
                  qtyDelta: q,
                  reason: reason as "RUSAK" | "HILANG" | "INVENTARIS" | "LAINNYA",
                  note: note || undefined,
                });
                if (r.error) toast.error(r.error);
                else {
                  toast.success("Penyesuaian disimpan");
                  setOpen(false);
                  setQtyDelta("");
                  setNote("");
                  router.refresh();
                }
              });
            }}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
