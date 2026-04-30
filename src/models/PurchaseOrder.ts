import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPurchaseItem {
  productId: Types.ObjectId;
  name: string;
  sku: string;
  qty: number;
  cost: number;
  subtotal: number;
}

export interface IPurchaseOrder extends Document {
  code: string;
  supplierId: Types.ObjectId;
  supplierName: string;
  items: IPurchaseItem[];
  total: number;
  createdById: Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    cost: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    code: { type: String, required: true, unique: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    supplierName: { type: String, required: true },
    items: { type: [PurchaseItemSchema], required: true },
    total: { type: Number, required: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ createdAt: -1 });

const PurchaseOrder: Model<IPurchaseOrder> =
  mongoose.models.PurchaseOrder ??
  mongoose.model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);

export default PurchaseOrder;
