"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";

export function InvoiceSearch() {
  const router = useRouter();
  const sp = useSearchParams();
  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/invoice?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch("");
    setFrom("");
    setTo("");
    router.push("/invoice");
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <div className="flex-1 min-w-40 space-y-1.5">
        <Label className="text-xs">Cari No. Invoice / Pelanggan</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="INV/2026/04/0001..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Dari Tanggal</Label>
        <Input type="date" className="h-9 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Sampai Tanggal</Label>
        <Input type="date" className="h-9 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSearch}>Cari</Button>
        <Button size="sm" variant="outline" onClick={handleReset}>Reset</Button>
      </div>
    </div>
  );
}
