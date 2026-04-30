import mongoose, { Schema, Document, Model, Types } from "mongoose";

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
  cashierId: Types.ObjectId;
  cashierName: string;
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

const SaleOrderSchema = new Schema<ISaleOrder>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
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
    cashierId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cashierName: { type: String, required: true },
  },
  { timestamps: true }
);

SaleOrderSchema.index({ createdAt: -1 });
SaleOrderSchema.index({ "customer.name": "text", invoiceNumber: "text" });

const SaleOrder: Model<ISaleOrder> =
  mongoose.models.SaleOrder ?? mongoose.model<ISaleOrder>("SaleOrder", SaleOrderSchema);

export default SaleOrder;
