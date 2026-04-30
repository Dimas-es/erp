"use client";

import { useState } from "react";
import { Printer, FileDown, Share2, ChevronDown, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

interface InvoiceActionsProps {
  invoiceNumber: string;
  total: number;
  customerName?: string;
}

export function InvoiceActions({ invoiceNumber, total, customerName }: InvoiceActionsProps) {
  const [open, setOpen] = useState(false);

  const handlePrint = () => {
    window.print();
    setOpen(false);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Halo${customerName ? ` ${customerName}` : ""}, berikut adalah invoice Anda:\n` +
      `No: ${invoiceNumber}\n` +
      `Total: Rp ${total.toLocaleString("id-ID")}\n\n` +
      `Terima kasih telah berbelanja di Toko Bangunan Maju!`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button variant="outline" size="sm" asChild>
        <Link href="/invoice">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/pos">
          Transaksi Baru
        </Link>
      </Button>

      {/* Action Dropdown */}
      <div className="relative">
        <Button
          size="sm"
          className="gap-1.5"
          style={{ background: "hsl(237 64% 58%)", color: "white" }}
          onClick={() => setOpen((v) => !v)}
        >
          <Printer className="h-4 w-4" />
          Aksi
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1.5 z-20 min-w-40 rounded-lg border bg-card shadow-lg overflow-hidden">
              <button
                onClick={handlePrint}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <Printer className="h-4 w-4 text-muted-foreground" />
                Cetak Invoice
              </button>
              <button
                onClick={handlePrint}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <FileDown className="h-4 w-4 text-muted-foreground" />
                Simpan PDF
              </button>
              <div className="h-px bg-border mx-3" />
              <button
                onClick={handleWhatsApp}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                style={{ color: "hsl(142 71% 40%)" }}
              >
                <Share2 className="h-4 w-4" />
                Share WhatsApp
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
