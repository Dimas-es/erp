import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { resolve } from "path";
import { subDays, subHours } from "date-fns";

config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✓ Connected to MongoDB");

  const db = mongoose.connection.db!;

  // Clear existing data
  await db.dropDatabase();
  console.log("✓ Database cleared");

  // Re-connect after drop
  await mongoose.connect(MONGODB_URI);

  // Dynamic imports after reconnect
  const { default: User } = await import("../src/models/User");
  const { default: Category } = await import("../src/models/Category");
  const { default: Unit } = await import("../src/models/Unit");
  const { default: Supplier } = await import("../src/models/Supplier");
  const { default: Product } = await import("../src/models/Product");
  const { default: SaleOrder } = await import("../src/models/SaleOrder");
  const { default: PurchaseOrder } = await import("../src/models/PurchaseOrder");
  const { default: StockMovement } = await import("../src/models/StockMovement");
  const { default: Counter } = await import("../src/models/Counter");

  // Users
  const adminHash = await bcrypt.hash("admin123", 10);
  const kasirHash = await bcrypt.hash("kasir123", 10);
  const [admin, kasir] = await User.insertMany([
    { name: "Admin Toko", email: "admin@toko.test", passwordHash: adminHash, role: "ADMIN" },
    { name: "Budi Santoso", email: "kasir@toko.test", passwordHash: kasirHash, role: "KASIR" },
  ]);
  console.log("✓ Users seeded");

  // Categories
  const categories = await Category.insertMany([
    { name: "Semen & Beton", slug: "semen-beton" },
    { name: "Besi & Baja", slug: "besi-baja" },
    { name: "Kayu & Triplek", slug: "kayu-triplek" },
    { name: "Cat & Pelapit", slug: "cat-pelapit" },
    { name: "Pipa & Sanitasi", slug: "pipa-sanitasi" },
    { name: "Atap & Genteng", slug: "atap-genteng" },
    { name: "Keramik & Lantai", slug: "keramik-lantai" },
    { name: "Alat Listrik", slug: "alat-listrik" },
    { name: "Paku & Sekrup", slug: "paku-sekrup" },
    { name: "Pasir & Batu", slug: "pasir-batu" },
  ]);
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c._id]));

  // Units
  const units = await Unit.insertMany([
    { name: "Zak", symbol: "zak" },
    { name: "Batang", symbol: "btg" },
    { name: "Lembar", symbol: "lbr" },
    { name: "Kilogram", symbol: "kg" },
    { name: "Meter", symbol: "m" },
    { name: "Meter Persegi", symbol: "m²" },
    { name: "Dus", symbol: "dus" },
    { name: "Buah", symbol: "bh" },
    { name: "Kubik", symbol: "m³" },
    { name: "Roll", symbol: "roll" },
  ]);
  const unitMap = Object.fromEntries(units.map((u) => [u.symbol, u._id]));

  // Suppliers
  const suppliers = await Supplier.insertMany([
    { name: "PT. Semen Indonesia", phone: "021-5555001", address: "Jl. Industri Raya No. 1, Gresik" },
    { name: "CV. Baja Nusantara", phone: "021-5555002", address: "Jl. Baja No. 15, Cikarang" },
    { name: "UD. Kayu Jati Mas", phone: "021-5555003", address: "Jl. Kayu Manis No. 8, Jepara" },
    { name: "PT. Nippon Paint", phone: "021-5555004", address: "Jl. Cat Raya No. 22, Tangerang" },
    { name: "CV. Pipa Prima", phone: "021-5555005", address: "Jl. Pipa No. 7, Bekasi" },
  ]);
  console.log("✓ Suppliers seeded");

  // Products (50 produk realistis)
  const productData = [
    // Semen
    { sku: "SEM-001", name: "Semen Portland Tiga Roda 50kg", cat: "semen-beton", unit: "zak", cost: 58000, sell: 65000, stock: 200, min: 20 },
    { sku: "SEM-002", name: "Semen Portland Holcim 50kg", cat: "semen-beton", unit: "zak", cost: 57000, sell: 64000, stock: 150, min: 20 },
    { sku: "SEM-003", name: "Semen Putih Tiara 5kg", cat: "semen-beton", unit: "zak", cost: 15000, sell: 18000, stock: 80, min: 10 },
    { sku: "SEM-004", name: "Semen Instan MU-301 40kg", cat: "semen-beton", unit: "zak", cost: 68000, sell: 78000, stock: 60, min: 10 },
    // Besi
    { sku: "BSI-001", name: "Besi Beton Ulir D10 SNI 12m", cat: "besi-baja", unit: "btg", cost: 48000, sell: 55000, stock: 500, min: 50 },
    { sku: "BSI-002", name: "Besi Beton Ulir D8 SNI 12m", cat: "besi-baja", unit: "btg", cost: 32000, sell: 37000, stock: 600, min: 50 },
    { sku: "BSI-003", name: "Besi Beton Ulir D12 SNI 12m", cat: "besi-baja", unit: "btg", cost: 68000, sell: 78000, stock: 400, min: 40 },
    { sku: "BSI-004", name: "Besi WF 100x50x5x7 SNI 6m", cat: "besi-baja", unit: "btg", cost: 320000, sell: 375000, stock: 100, min: 15 },
    { sku: "BSI-005", name: "Seng Gelombang BJLS 0.3mm 120x240cm", cat: "besi-baja", unit: "lbr", cost: 38000, sell: 44000, stock: 200, min: 20 },
    // Kayu
    { sku: "KYU-001", name: "Kayu Meranti 5/7 x 400cm", cat: "kayu-triplek", unit: "btg", cost: 18000, sell: 22000, stock: 300, min: 30 },
    { sku: "KYU-002", name: "Kayu Meranti 5/10 x 400cm", cat: "kayu-triplek", unit: "btg", cost: 28000, sell: 33000, stock: 250, min: 30 },
    { sku: "KYU-003", name: "Triplek 3mm 122x244cm", cat: "kayu-triplek", unit: "lbr", cost: 55000, sell: 64000, stock: 100, min: 15 },
    { sku: "KYU-004", name: "Triplek 9mm 122x244cm", cat: "kayu-triplek", unit: "lbr", cost: 135000, sell: 158000, stock: 80, min: 10 },
    { sku: "KYU-005", name: "Papan Cor 2/20 x 300cm", cat: "kayu-triplek", unit: "btg", cost: 12000, sell: 15000, stock: 400, min: 40 },
    // Cat
    { sku: "CAT-001", name: "Cat Tembok Dulux 5kg Putih", cat: "cat-pelapit", unit: "kg", cost: 75000, sell: 90000, stock: 50, min: 8 },
    { sku: "CAT-002", name: "Cat Tembok Avitex 25kg", cat: "cat-pelapit", unit: "kg", cost: 280000, sell: 330000, stock: 30, min: 5 },
    { sku: "CAT-003", name: "Cat Besi Kansai 1kg", cat: "cat-pelapit", unit: "kg", cost: 28000, sell: 35000, stock: 60, min: 8 },
    { sku: "CAT-004", name: "Plamur Tembok 5kg", cat: "cat-pelapit", unit: "kg", cost: 22000, sell: 28000, stock: 40, min: 5 },
    { sku: "CAT-005", name: "Waterproofing Aquaproof 4kg", cat: "cat-pelapit", unit: "kg", cost: 82000, sell: 98000, stock: 25, min: 5 },
    // Pipa
    { sku: "PPA-001", name: "Pipa PVC AW 1/2\" x 4m", cat: "pipa-sanitasi", unit: "btg", cost: 18000, sell: 22000, stock: 200, min: 20 },
    { sku: "PPA-002", name: "Pipa PVC AW 3/4\" x 4m", cat: "pipa-sanitasi", unit: "btg", cost: 28000, sell: 34000, stock: 150, min: 20 },
    { sku: "PPA-003", name: "Pipa PVC AW 1\" x 4m", cat: "pipa-sanitasi", unit: "btg", cost: 42000, sell: 50000, stock: 120, min: 15 },
    { sku: "PPA-004", name: "Kran Air Stainless 1/2\"", cat: "pipa-sanitasi", unit: "bh", cost: 18000, sell: 24000, stock: 80, min: 10 },
    { sku: "PPA-005", name: "Lem Pipa PVC 200ml", cat: "pipa-sanitasi", unit: "bh", cost: 8000, sell: 12000, stock: 100, min: 15 },
    // Atap
    { sku: "ATP-001", name: "Genteng Flat Karangpilang", cat: "atap-genteng", unit: "bh", cost: 3200, sell: 3800, stock: 5000, min: 200 },
    { sku: "ATP-002", name: "Seng Datar 0.2mm 90x180cm", cat: "atap-genteng", unit: "lbr", cost: 28000, sell: 34000, stock: 150, min: 20 },
    { sku: "ATP-003", name: "Asbes Gelombang 3mm 210x105cm", cat: "atap-genteng", unit: "lbr", cost: 62000, sell: 74000, stock: 80, min: 10 },
    // Keramik
    { sku: "KRM-001", name: "Keramik Lantai 40x40 Roman", cat: "keramik-lantai", unit: "dus", cost: 58000, sell: 72000, stock: 100, min: 15 },
    { sku: "KRM-002", name: "Keramik Lantai 60x60 Granit", cat: "keramik-lantai", unit: "dus", cost: 165000, sell: 195000, stock: 60, min: 10 },
    { sku: "KRM-003", name: "Keramik Dinding 25x40 KIA", cat: "keramik-lantai", unit: "dus", cost: 72000, sell: 88000, stock: 80, min: 10 },
    // Listrik
    { sku: "LST-001", name: "Kabel NYM 2x1.5mm 50m", cat: "alat-listrik", unit: "roll", cost: 178000, sell: 215000, stock: 30, min: 5 },
    { sku: "LST-002", name: "Stop Kontak Panasonic 2 Lubang", cat: "alat-listrik", unit: "bh", cost: 15000, sell: 20000, stock: 60, min: 10 },
    { sku: "LST-003", name: "Saklar Tunggal Broco", cat: "alat-listrik", unit: "bh", cost: 8000, sell: 12000, stock: 80, min: 15 },
    { sku: "LST-004", name: "MCB 1 Phase 6A Schneider", cat: "alat-listrik", unit: "bh", cost: 42000, sell: 55000, stock: 40, min: 8 },
    // Paku
    { sku: "PKU-001", name: "Paku Biasa 10cm 1kg", cat: "paku-sekrup", unit: "kg", cost: 12000, sell: 16000, stock: 150, min: 20 },
    { sku: "PKU-002", name: "Paku Biasa 7cm 1kg", cat: "paku-sekrup", unit: "kg", cost: 11000, sell: 15000, stock: 150, min: 20 },
    { sku: "PKU-003", name: "Paku Beton 2cm 100bh", cat: "paku-sekrup", unit: "bh", cost: 8000, sell: 12000, stock: 200, min: 20 },
    { sku: "PKU-004", name: "Sekrup Kayu 4cm 100bh", cat: "paku-sekrup", unit: "bh", cost: 9000, sell: 13000, stock: 180, min: 20 },
    { sku: "PKU-005", name: "Angkur Fisher M6 100bh", cat: "paku-sekrup", unit: "bh", cost: 22000, sell: 28000, stock: 100, min: 10 },
    // Pasir
    { sku: "PSR-001", name: "Pasir Beton Halus per m³", cat: "pasir-batu", unit: "m³", cost: 180000, sell: 220000, stock: 50, min: 5 },
    { sku: "PSR-002", name: "Pasir Plester Halus per m³", cat: "pasir-batu", unit: "m³", cost: 200000, sell: 245000, stock: 30, min: 5 },
    { sku: "PSR-003", name: "Batu Split 1-2cm per m³", cat: "pasir-batu", unit: "m³", cost: 220000, sell: 270000, stock: 25, min: 5 },
    { sku: "PSR-004", name: "Batu Bata Merah per 1000bh", cat: "pasir-batu", unit: "bh", cost: 450000, sell: 550000, stock: 20000, min: 1000 },
    // Tambahan
    { sku: "BSI-006", name: "Hollow Besi 4x4x1.2mm 6m", cat: "besi-baja", unit: "btg", cost: 42000, sell: 52000, stock: 200, min: 20 },
    { sku: "BSI-007", name: "Kawat Bendrat 1kg", cat: "besi-baja", unit: "kg", cost: 14000, sell: 18000, stock: 100, min: 10 },
    { sku: "CAT-006", name: "Roll Cat 10\" Velvet", cat: "cat-pelapit", unit: "bh", cost: 18000, sell: 24000, stock: 40, min: 8 },
    { sku: "PPA-006", name: "Kloset Duduk Toto", cat: "pipa-sanitasi", unit: "bh", cost: 680000, sell: 850000, stock: 10, min: 2 },
    { sku: "KRM-004", name: "Nat Keramik Abu-abu 1kg", cat: "keramik-lantai", unit: "kg", cost: 8000, sell: 12000, stock: 100, min: 15 },
    { sku: "PKU-006", name: "Baut & Mur M10x1\" 10bh", cat: "paku-sekrup", unit: "bh", cost: 12000, sell: 16000, stock: 120, min: 15 },
    { sku: "LST-005", name: "Pipa Conduit 20mm x 3m", cat: "alat-listrik", unit: "btg", cost: 12000, sell: 16000, stock: 100, min: 15 },
  ];

  const products = await Product.insertMany(
    productData.map((p) => ({
      sku: p.sku,
      name: p.name,
      categoryId: catMap[p.cat],
      unitId: unitMap[p.unit],
      costPrice: p.cost,
      sellPrice: p.sell,
      stock: p.stock,
      minStock: p.min,
    }))
  );
  console.log(`✓ ${products.length} products seeded`);

  const productMap = Object.fromEntries(products.map((p) => [p.sku, p]));

  // Generate 30 backdated sale orders
  const saleProducts = products.slice(0, 20);
  const cashierUsers = [admin, kasir];

  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const hoursAgo = Math.floor(Math.random() * 10);
    const createdAt = subHours(subDays(new Date(), daysAgo), hoursAgo);

    const numItems = Math.floor(Math.random() * 4) + 1;
    const selectedProducts = [...saleProducts]
      .sort(() => 0.5 - Math.random())
      .slice(0, numItems);

    const items = selectedProducts.map((p) => {
      const qty = Math.floor(Math.random() * 5) + 1;
      return {
        productId: p._id,
        name: p.name,
        sku: p.sku,
        qty,
        price: p.sellPrice,
        subtotal: qty * p.sellPrice,
      };
    });

    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const discount = i % 5 === 0 ? Math.floor(subtotal * 0.05) : 0;
    const total = subtotal - discount;
    const paid = total + (Math.floor(Math.random() * 5) * 1000);
    const cashier = cashierUsers[i % 2];

    const monthKey = `invoice-${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const counter = await Counter.findOneAndUpdate(
      { _id: monthKey },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
    const seq = String(counter.seq).padStart(4, "0");
    const invoiceNumber = `INV/${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(2, "0")}/${seq}`;

    await SaleOrder.create({
      invoiceNumber,
      customer: i % 3 === 0 ? { name: `Pelanggan ${i + 1}`, phone: `0812345678${i}` } : undefined,
      items,
      subtotal,
      discount,
      tax: 0,
      total,
      paid,
      change: paid - total,
      cashierId: cashier._id,
      cashierName: cashier.name,
      createdAt,
      updatedAt: createdAt,
    });

    // Stock movements
    for (const item of items) {
      await StockMovement.create({
        productId: item.productId,
        productName: item.name,
        productSku: item.sku,
        type: "OUT",
        qty: item.qty,
        refType: "SALE",
        refId: new mongoose.Types.ObjectId(),
        refCode: invoiceNumber,
        createdAt,
      });
    }
  }
  console.log("✓ 30 sale orders seeded");

  // 3 purchase orders
  const poData = [
    {
      supplier: suppliers[0],
      products: ["SEM-001", "SEM-002"],
      daysAgo: 5,
    },
    {
      supplier: suppliers[1],
      products: ["BSI-001", "BSI-002", "BSI-003"],
      daysAgo: 3,
    },
    {
      supplier: suppliers[3],
      products: ["CAT-001", "CAT-003"],
      daysAgo: 1,
    },
  ];

  for (let i = 0; i < poData.length; i++) {
    const po = poData[i];
    const createdAt = subDays(new Date(), po.daysAgo);
    const items = po.products.map((sku) => {
      const p = productMap[sku];
      const qty = 50 + i * 10;
      return {
        productId: p._id,
        name: p.name,
        sku: p.sku,
        qty,
        cost: p.costPrice,
        subtotal: qty * p.costPrice,
      };
    });
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    const code = `PO/${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(2, "0")}/${String(i + 1).padStart(4, "0")}`;

    await PurchaseOrder.create({
      code,
      supplierId: po.supplier._id,
      supplierName: po.supplier.name,
      items,
      total,
      createdById: admin._id,
      createdByName: admin.name,
      createdAt,
      updatedAt: createdAt,
    });
  }
  console.log("✓ 3 purchase orders seeded");

  console.log("\n🎉 Seed selesai!");
  console.log("Login: admin@toko.test / admin123");
  console.log("Login: kasir@toko.test / kasir123");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
