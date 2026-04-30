import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IStockMovement extends Document {
  productId: Types.ObjectId;
  productName: string;
  productSku: string;
  type: "IN" | "OUT";
  qty: number;
  refType: "SALE" | "PURCHASE" | "ADJUST";
  refId: Types.ObjectId;
  refCode: string;
  adjustReason?: string;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productSku: { type: String, required: true },
    type: { type: String, enum: ["IN", "OUT"], required: true },
    qty: { type: Number, required: true, min: 1 },
    refType: { type: String, enum: ["SALE", "PURCHASE", "ADJUST"], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    refCode: { type: String, required: true },
    adjustReason: { type: String },
  },
  { timestamps: true }
);

StockMovementSchema.index({ productId: 1, createdAt: -1 });
StockMovementSchema.index({ createdAt: -1 });

const StockMovement: Model<IStockMovement> =
  mongoose.models.StockMovement ??
  mongoose.model<IStockMovement>("StockMovement", StockMovementSchema);

export default StockMovement;
