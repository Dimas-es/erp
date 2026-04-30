"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";

interface StockFilterProps {
  defaultSearch?: string;
  defaultLowStock?: boolean;
}

export function StockFilter({ defaultSearch, defaultLowStock }: StockFilterProps) {
  const router = useRouter();
  const [search, setSearch] = useState(defaultSearch ?? "");
  const [lowStock, setLowStock] = useState(defaultLowStock ?? false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (lowStock) params.set("lowStock", "1");
    router.push(`/stok?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch("");
    setLowStock(false);
    router.push("/stok");
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <div className="flex-1 min-w-40 space-y-1.5">
        <Label className="text-xs">Cari Produk / SKU</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Semen, besi, paku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pb-0.5">
        <input
          type="checkbox"
          id="lowStock"
          checked={lowStock}
          onChange={(e) => setLowStock(e.target.checked)}
          className="h-4 w-4 rounded border border-input"
        />
        <Label htmlFor="lowStock" className="text-sm cursor-pointer">
          Hanya stok menipis
        </Label>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSearch}>Cari</Button>
        <Button size="sm" variant="outline" onClick={handleReset}>Reset</Button>
      </div>
    </div>
  );
}
