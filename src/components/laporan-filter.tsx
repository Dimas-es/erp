"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";

interface LaporanFilterProps {
  defaultFrom?: string;
  defaultTo?: string;
}

export function LaporanFilter({ defaultFrom, defaultTo }: LaporanFilterProps) {
  const router = useRouter();
  const [from, setFrom] = useState(defaultFrom ?? "");
  const [to, setTo] = useState(defaultTo ?? "");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/laporan?${params.toString()}`);
  };

  const handleReset = () => {
    setFrom("");
    setTo("");
    router.push("/laporan");
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Dari Tanggal</Label>
        <Input type="date" className="h-9 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Sampai Tanggal</Label>
        <Input type="date" className="h-9 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSearch}>Tampilkan</Button>
        <Button size="sm" variant="outline" onClick={handleReset}>Reset</Button>
      </div>
    </div>
  );
}
