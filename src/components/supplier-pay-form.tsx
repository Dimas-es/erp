"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { recordSupplierPayment } from "@/src/actions/purchase";

export function SupplierPayForm({
  purchaseId,
  balanceDue,
}: {
  purchaseId: string;
  balanceDue: number;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (balanceDue <= 0) return null;

  return (
    <div className="flex flex-wrap items-end gap-2 mt-2">
      <div>
        <Label className="text-xs">Bayar (Rp)</Label>
        <Input
          type="number"
          className="h-8 w-32 text-sm"
          max={balanceDue}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="min-w-[120px]">
        <Label className="text-xs">Catatan</Label>
        <Input className="h-8 text-sm" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button
        size="sm"
        disabled={pending}
        onClick={() => {
          const n = Number(amount);
          if (!n) return toast.error("Jumlah tidak valid");
          startTransition(async () => {
            const r = await recordSupplierPayment(purchaseId, n, note || undefined);
            if (r.error) toast.error(r.error);
            else {
              toast.success("Pembayaran supplier tercatat");
              router.refresh();
            }
          });
        }}
      >
        Bayar
      </Button>
    </div>
  );
}
