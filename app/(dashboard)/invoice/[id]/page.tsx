import { notFound } from "next/navigation";
import { getSaleOrderById } from "@/src/actions/sale";
import { formatRupiah, terbilangRupiah } from "@/src/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Separator } from "@/src/components/ui/separator";
import { InvoiceActions } from "@/src/components/invoice-actions";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: invoiceId } = await params;
  const order = await getSaleOrderById(invoiceId);
  if (!order) notFound();

  const isPaid = order.paid >= order.total;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <InvoiceActions
          invoiceNumber={order.invoiceNumber}
          total={order.total}
          customerName={order.customer?.name}
        />
      </div>

      {/* Invoice Print Area */}
      <div
        id="invoice-print"
        className="relative max-w-2xl mx-auto bg-white rounded-xl overflow-hidden print:rounded-none print:max-w-full print:shadow-none"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
      >
        {/* LUNAS Watermark */}
        {isPaid && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
            aria-hidden="true"
          >
            <span
              style={{
                transform: "rotate(-15deg)",
                fontSize: "8rem",
                fontWeight: 800,
                color: "hsl(142 71% 45% / 0.06)",
                letterSpacing: "0.1em",
                userSelect: "none",
                lineHeight: 1,
              }}
            >
              LUNAS
            </span>
          </div>
        )}

        {/* Header — light & friendly */}
        <div
          className="px-8 py-5 flex items-center justify-between border-b"
          style={{
            background: "linear-gradient(135deg, hsl(237 100% 98%), hsl(38 100% 97%))",
            borderColor: "hsl(220 20% 92%)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm"
              style={{ background: "linear-gradient(135deg, hsl(237 64% 58%), hsl(237 70% 68%))" }}
            >
              {/* Hard hat icon SVG */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 20h20v2H2v-2zm1-6h1c0-4.42 3.58-8 8-8s8 3.58 8 8h1c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1H3c-.55 0-1-.45-1-1v-1c0-.55.45-1 1-1zm8-6V5h2v3c2.76.55 5 2.91 5.42 5.87L6.58 7.87C7 4.91 9.24 2.55 12 2z" fill="white"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-base leading-tight" style={{ color: "hsl(224 28% 22%)" }}>
                TOKO BANGUNAN MAJU
              </p>
              <p className="text-xs" style={{ color: "hsl(220 12% 50%)" }}>
                Jl. Raya Industri No. 88, Jakarta
              </p>
            </div>
          </div>
          {/* Invoice number */}
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest" style={{ color: "hsl(220 12% 50%)" }}>
              Invoice
            </p>
            <p className="font-bold font-mono text-lg mt-0.5" style={{ color: "hsl(237 64% 45%)" }}>
              {order.invoiceNumber}
            </p>
          </div>
        </div>

        {/* Indigo→Amber accent line */}
        <div
          className="h-1"
          style={{ background: "linear-gradient(90deg, hsl(237 64% 58%), hsl(38 92% 50%))" }}
        />

        {/* Body */}
        <div className="px-8 py-6 bg-white">
          {/* Date & Status row */}
          <div className="flex items-center justify-between mb-5 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Tanggal</p>
              <p className="font-medium text-gray-800">
                {format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", { locale: id })}
              </p>
            </div>
            {isPaid && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: "hsl(142 71% 45% / 0.12)",
                  color: "hsl(142 60% 32%)",
                  border: "1px solid hsl(142 71% 45% / 0.3)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "hsl(142 71% 45%)" }}
                />
                LUNAS
              </span>
            )}
          </div>

          {/* Customer & Cashier */}
          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <p className="text-gray-400 uppercase text-xs tracking-wide mb-1">Kepada</p>
              {order.customer?.name ? (
                <>
                  <p className="font-semibold text-gray-800">{order.customer.name}</p>
                  {order.customer.phone && (
                    <p className="text-gray-500">{order.customer.phone}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-400 italic">Pelanggan Umum</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-gray-400 uppercase text-xs tracking-wide mb-1">Kasir</p>
              <p className="font-semibold text-gray-800">{order.cashierName}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm mb-5">
            <thead>
              <tr
                style={{
                  background: "hsl(237 64% 96%)",
                  color: "hsl(237 64% 35%)",
                }}
                className="rounded-lg"
              >
                <th className="py-2.5 px-3 text-left font-semibold text-xs uppercase tracking-wide rounded-l-lg">
                  Produk
                </th>
                <th className="py-2.5 px-3 text-center font-semibold text-xs uppercase tracking-wide w-14">
                  Qty
                </th>
                <th className="py-2.5 px-3 text-right font-semibold text-xs uppercase tracking-wide">
                  Harga
                </th>
                <th className="py-2.5 px-3 text-right font-semibold text-xs uppercase tracking-wide rounded-r-lg">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr
                  key={i}
                  className="border-b"
                  style={{ borderColor: "hsl(214 32% 91%)" }}
                >
                  <td className="py-3 px-3">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.sku}</p>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-600">{item.qty}</td>
                  <td className="py-3 px-3 text-right text-gray-600 tabular-nums">{formatRupiah(item.price)}</td>
                  <td className="py-3 px-3 text-right font-semibold text-gray-800 tabular-nums">
                    {formatRupiah(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatRupiah(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Diskon</span>
                  <span className="tabular-nums">- {formatRupiah(order.discount)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Pajak</span>
                  <span className="tabular-nums">{formatRupiah(order.tax)}</span>
                </div>
              )}
              {/* Highlighted total box */}
              <div
                className="rounded-lg px-3 py-2.5 mt-2"
                style={{
                  background: "hsl(237 64% 58% / 0.06)",
                  border: "2px solid hsl(38 92% 50% / 0.5)",
                }}
              >
                <div className="flex justify-between font-bold text-base text-gray-900">
                  <span>TOTAL</span>
                  <span className="tabular-nums">{formatRupiah(order.total)}</span>
                </div>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Dibayar</span>
                <span className="tabular-nums">{formatRupiah(order.paid)}</span>
              </div>
              <div className="flex justify-between font-medium" style={{ color: "hsl(142 60% 36%)" }}>
                <span>Kembalian</span>
                <span className="tabular-nums">{formatRupiah(order.change)}</span>
              </div>
            </div>
          </div>

          {/* Terbilang */}
          <div
            className="mt-4 rounded-lg p-3 text-sm"
            style={{ background: "hsl(210 20% 96%)", border: "1px solid hsl(214 32% 91%)" }}
          >
            <span className="font-medium text-gray-700">Terbilang: </span>
            <span className="italic text-gray-600">{terbilangRupiah(order.total)}</span>
          </div>

          <Separator className="my-6" />

          {/* Footer */}
          <div className="flex items-end justify-between text-xs text-gray-400">
            <div>
              <p>Terima kasih atas kepercayaan Anda!</p>
              <p>Barang yang sudah dibeli tidak dapat dikembalikan.</p>
            </div>
            <div className="text-right">
              <p className="mb-12">Kasir,</p>
              <p className="border-t border-gray-300 pt-1 font-medium text-gray-600">
                {order.cashierName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
