"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { recordSalePayment } from "@/src/actions/sale";

export function ReceivablePayForm({ saleId, balanceDue }: { saleId: string; balanceDue: number }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (balanceDue <= 0) return null;

  return (
    <div className="rounded-xl border p-4 space-y-3 print:hidden bg-amber-50/50 border-amber-200">
      <p className="text-sm font-semibold text-amber-900">Catat pelunasan piutang</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="pay-amt">Jumlah (Rp)</Label>
          <Input
            id="pay-amt"
            type="number"
            min={1}
            max={balanceDue}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Maks ${balanceDue}`}
          />
        </div>
        <div>
          <Label htmlFor="pay-note">Catatan</Label>
          <Input id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <Button
        disabled={pending}
        onClick={() => {
          const n = Number(amount);
          if (!n || n < 1) return toast.error("Jumlah tidak valid");
          startTransition(async () => {
            const r = await recordSalePayment(saleId, n, note || undefined);
            if (r.error) toast.error(r.error);
            else {
              toast.success("Pelunasan tercatat");
              router.refresh();
            }
          });
        }}
      >
        Simpan pelunasan
      </Button>
    </div>
  );
}
