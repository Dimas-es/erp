import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISalePayment {
  amount: number;
  paidAt: Date;
  recordedById: Types.ObjectId;
  recordedByName: string;
  note?: string;
}

export interface ISaleItem {
  productId: Types.ObjectId;
  name: string;
  sku: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface ISaleOrder extends Document {
  invoiceNumber: string;
  customerId?: Types.ObjectId;
  customer?: {
    name: string;
    phone?: string;
  };
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  change: number;
  paymentStatus: "LUNAS" | "BELUM_LUNAS";
  balanceDue: number;
  dueDate?: Date;
  payments: ISalePayment[];
  cashierId: Types.ObjectId;
  cashierName: string;
  shiftId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SalePaymentSchema = new Schema<ISalePayment>(
  {
    amount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date, required: true, default: Date.now },
    recordedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedByName: { type: String, required: true },
    note: { type: String },
  },
  { _id: false }
);

const SaleOrderSchema = new Schema<ISaleOrder>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customer: {
      name: { type: String },
      phone: { type: String },
    },
    items: { type: [SaleItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paid: { type: Number, required: true },
    change: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["LUNAS", "BELUM_LUNAS"],
      default: "LUNAS",
    },
    balanceDue: { type: Number, default: 0 },
    dueDate: { type: Date },
    payments: { type: [SalePaymentSchema], default: [] },
    cashierId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cashierName: { type: String, required: true },
    shiftId: { type: Schema.Types.ObjectId, ref: "CashShift" },
  },
  { timestamps: true }
);

SaleOrderSchema.index({ createdAt: -1 });
SaleOrderSchema.index({ paymentStatus: 1 });
SaleOrderSchema.index({ "customer.name": "text", invoiceNumber: "text" });

const SaleOrder: Model<ISaleOrder> =
  mongoose.models.SaleOrder ?? mongoose.model<ISaleOrder>("SaleOrder", SaleOrderSchema);

export default SaleOrder;
