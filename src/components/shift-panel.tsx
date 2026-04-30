"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { openShift, closeShift } from "@/src/actions/shift";
import { formatRupiah } from "@/src/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function ShiftControls({
  openShiftRow,
  userRole,
}: {
  openShiftRow: { _id: string; openedAt: string; openingFloat: number } | null;
  userRole: "ADMIN" | "KASIR";
}) {
  const [opening, setOpening] = useState("");
  const [closing, setClosing] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (userRole === "KASIR" && !openShiftRow) {
    return (
      <div className="rounded-xl border p-4 space-y-3 max-w-md">
        <h3 className="font-semibold">Buka shift</h3>
        <div>
          <Label>Saldo awal laci (Rp)</Label>
          <Input type="number" value={opening} onChange={(e) => setOpening(e.target.value)} />
        </div>
        <Button
          disabled={pending}
          onClick={() => {
            const n = Number(opening);
            if (n < 0 || Number.isNaN(n)) return toast.error("Saldo awal tidak valid");
            startTransition(async () => {
              const r = await openShift(n);
              if (r.error) toast.error(r.error);
              else {
                toast.success("Shift dibuka");
                router.refresh();
              }
            });
          }}
        >
          Buka shift
        </Button>
      </div>
    );
  }

  if (userRole === "KASIR" && openShiftRow) {
    return (
      <div className="rounded-xl border p-4 space-y-3 max-w-md">
        <div className="text-sm">
          <p className="font-semibold">Shift aktif</p>
          <p className="text-muted-foreground">
            Mulai {format(new Date(openShiftRow.openedAt), "d MMM yyyy HH:mm", { locale: id })} ·
            saldo awal {formatRupiah(openShiftRow.openingFloat)}
          </p>
        </div>
        <div>
          <Label>Uang dihitung di laci (Rp)</Label>
          <Input type="number" value={closing} onChange={(e) => setClosing(e.target.value)} />
        </div>
        <div>
          <Label>Catatan selisih (opsional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            const n = Number(closing);
            if (Number.isNaN(n)) return toast.error("Isi jumlah hitung kas");
            startTransition(async () => {
              const r = await closeShift(openShiftRow._id, n, note || undefined);
              if (r.error) toast.error(r.error);
              else {
                toast.success(
                  `Shift ditutup. Harusnya: ${formatRupiah(r.expectedCash ?? 0)}, selisih: ${formatRupiah(r.difference ?? 0)}`
                );
                router.refresh();
              }
            });
          }}
        >
          Tutup shift
        </Button>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Sebagai admin Anda dapat melihat semua riwayat shift. Kasir membuka/menutup shift dari akun
      mereka.
    </p>
  );
}
