"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Loader2,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import { cn, formatRupiah } from "@/src/lib/utils";
import { createSale } from "@/src/actions/sale";

interface ProductResult {
  _id: string;
  sku: string;
  name: string;
  sellPrice: number;
  stock: number;
  unit: string;
  category?: string;
}

interface CartItem extends ProductResult {
  qty: number;
  subtotal: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Color-code categories in warm industrial style
const CATEGORY_COLORS: Record<string, string> = {
  semen: "#3b82f6",
  besi: "#6b7280",
  kayu: "#92400e",
  cat: "#ec4899",
  batu: "#78716c",
  keramik: "#0891b2",
  pipa: "#16a34a",
  kabel: "#dc2626",
  default: "hsl(237 64% 58%)",
};

function getCategoryColor(category?: string): string {
  if (!category) return CATEGORY_COLORS.default;
  const key = Object.keys(CATEGORY_COLORS).find((k) =>
    category.toLowerCase().includes(k)
  );
  return key ? CATEGORY_COLORS[key] : CATEGORY_COLORS.default;
}

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000];

export function POSClient() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileTab, setMobileTab] = useState<"products" | "cart">("products");
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useSWR<ProductResult[]>(
    `/api/products/search?q=${encodeURIComponent(search)}`,
    fetcher,
    { dedupingInterval: 300 }
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const addToCart = useCallback((product: ProductResult) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error(`Stok ${product.name} hanya ${product.stock}`);
          return prev;
        }
        return prev.map((i) =>
          i._id === product._id
            ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.sellPrice }
            : i
        );
      }
      return [...prev, { ...product, qty: 1, subtotal: product.sellPrice }];
    });
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i._id !== id) return i;
          const newQty = i.qty + delta;
          if (newQty <= 0) return null;
          if (newQty > i.stock) {
            toast.error(`Stok hanya ${i.stock}`);
            return i;
          }
          return { ...i, qty: newQty, subtotal: newQty * i.sellPrice };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((i) => i._id !== id));

  const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const total = Math.max(0, subtotal - discount);
  const change = typeof paid === "number" ? paid - total : 0;

  const handleSubmit = async () => {
    if (cart.length === 0) return toast.error("Keranjang kosong");
    if (typeof paid !== "number" || paid < total) {
      return toast.error("Jumlah bayar kurang");
    }

    setIsSubmitting(true);
    try {
      const result = await createSale({
        customer: customerName ? { name: customerName, phone: customerPhone } : undefined,
        items: cart.map((i) => ({
          productId: i._id,
          name: i.name,
          sku: i.sku,
          qty: i.qty,
          price: i.sellPrice,
          subtotal: i.subtotal,
        })),
        subtotal,
        discount,
        tax: 0,
        total,
        paid,
        change,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Transaksi berhasil!");
        router.push(`/invoice/${result.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 min-h-0">
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden border rounded-xl overflow-hidden shrink-0">
        <button
          onClick={() => setMobileTab("products")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium transition-colors",
            mobileTab === "products"
              ? "text-white"
              : "bg-card text-muted-foreground"
          )}
          style={mobileTab === "products" ? { background: "hsl(237 64% 58%)" } : {}}
        >
          Produk
        </button>
        <button
          onClick={() => setMobileTab("cart")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium transition-colors relative",
            mobileTab === "cart"
              ? "text-white"
              : "bg-card text-muted-foreground"
          )}
          style={mobileTab === "cart" ? { background: "hsl(237 64% 58%)" } : {}}
        >
          Keranjang
          {cart.length > 0 && (
            <span
              className="absolute top-1.5 right-4 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: "hsl(38 92% 50%)" }}
            >
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
      {/* Left: Product Grid */}
      <div className={cn(
        "flex flex-col gap-4 overflow-hidden min-w-0",
        "md:flex md:flex-1",
        mobileTab === "products" ? "flex flex-1" : "hidden"
      )}>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Kasir / POS</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            className="pl-9"
            placeholder="Cari produk atau SKU... (F2)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border p-3 h-24 skeleton-shimmer"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
              <PackageOpen className="h-12 w-12 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {search ? "Produk tidak ditemukan" : "Mulai ketik untuk mencari produk"}
                </p>
                {search && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Coba kata kunci lain atau periksa SKU
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((p) => {
                const borderColor = getCategoryColor(p.category);
                return (
                  <motion.button
                    key={p._id}
                    onClick={() => addToCart(p)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-lg border bg-card p-3 text-left transition-shadow hover:shadow-glow relative overflow-hidden"
                    style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
                  >
                    <p className="text-xs text-muted-foreground mb-0.5">{p.sku}</p>
                    <p className="text-sm font-medium leading-tight line-clamp-2">{p.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm font-bold tabular-nums" style={{ color: borderColor }}>
                        {formatRupiah(p.sellPrice)}
                      </p>
                      <Badge
                        variant={p.stock <= 5 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {p.stock} {p.unit}
                      </Badge>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className={cn(
        "flex flex-col gap-3 min-h-0",
        "md:flex md:w-80 md:shrink-0",
        mobileTab === "cart" ? "flex flex-1" : "hidden"
      )}>
        {/* Cart Items */}
        <div
          className="flex-1 flex flex-col overflow-hidden rounded-xl border bg-card"
          style={{ minHeight: 0 }}
        >
          {/* Cart header */}
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Keranjang</span>
            </div>
            {cart.length > 0 && (
              <Badge variant="secondary">{cart.length} item</Badge>
            )}
          </div>

          {/* Cart body */}
          <div className="flex-1 overflow-y-auto p-3">
            <AnimatePresence initial={false}>
              {cart.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center"
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ background: "hsl(var(--muted))" }}
                  >
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Keranjang kosong</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pilih produk untuk memulai
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.15 }}
                      className="rounded-lg border bg-background p-2.5 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-medium leading-tight flex-1 line-clamp-2">
                          {item.name}
                        </p>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-md"
                            onClick={() => updateQty(item._id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-7 text-center text-sm font-medium tabular-nums">
                            {item.qty}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-md"
                            onClick={() => updateQty(item._id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm font-semibold tabular-nums">
                          {formatRupiah(item.subtotal)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Sticky total bar */}
          {cart.length > 0 && (
            <div
              className="border-t px-4 py-3 flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, hsl(237 100% 97%), hsl(38 100% 96%))",
                color: "hsl(224 28% 22%)",
              }}
            >
              <span className="text-sm font-medium text-muted-foreground">Total</span>
              <span className="text-xl font-bold tabular-nums" style={{ color: "hsl(237 64% 45%)" }}>
                {formatRupiah(total)}
              </span>
            </div>
          )}
        </div>

        {/* Payment Card */}
        <div className="rounded-xl border bg-card p-4 space-y-3 shrink-0">
          {/* Customer */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Pelanggan (opsional)</Label>
            <Input
              placeholder="Nama pelanggan..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              placeholder="No. telepon..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs whitespace-nowrap">Diskon (Rp)</span>
              <Input
                type="number"
                min="0"
                max={subtotal}
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="h-7 text-xs text-right"
                placeholder="0"
              />
            </div>
          </div>

          <Separator />

          {/* Payment */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Jumlah Bayar (Rp)</Label>
            <Input
              type="number"
              min={total}
              value={paid}
              onChange={(e) => setPaid(e.target.value ? Number(e.target.value) : "")}
              className="text-right font-semibold tabular-nums"
              placeholder={formatRupiah(total)}
            />
            {/* Quick amount buttons */}
            <div className="grid grid-cols-4 gap-1">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setPaid(amount)}
                  className="rounded-md text-xs py-1.5 font-medium transition-colors border hover:bg-primary hover:text-primary-foreground"
                >
                  {amount >= 1_000_000
                    ? `${amount / 1_000_000}jt`
                    : `${amount / 1_000}rb`}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPaid(total)}
              className="w-full rounded-md text-xs py-1.5 font-medium border transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Pas ({formatRupiah(total)})
            </button>
            {typeof paid === "number" && paid >= total && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between text-sm"
              >
                <span className="text-muted-foreground">Kembalian</span>
                <span className="font-semibold tabular-nums" style={{ color: "hsl(142 71% 45%)" }}>
                  {formatRupiah(change)}
                </span>
              </motion.div>
            )}
          </div>

          <Button
            className="w-full gap-2 font-semibold"
            size="lg"
            onClick={handleSubmit}
            disabled={cart.length === 0 || isSubmitting}
            style={
              cart.length > 0 && !isSubmitting
                ? {
                    background: "linear-gradient(135deg, hsl(237 64% 58%), hsl(237 70% 68%))",
                    color: "white",
                  }
                : undefined
            }
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {isSubmitting ? "Memproses..." : "Bayar Sekarang"}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
