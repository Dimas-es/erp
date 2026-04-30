"use client";

import { Button } from "@/src/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer className="mr-2 h-4 w-4" />
      Cetak Invoice
    </Button>
  );
}
