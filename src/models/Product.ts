import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProduct extends Document {
  sku: string;
  name: string;
  categoryId: Types.ObjectId;
  unitId: Types.ObjectId;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  barcode?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit", required: true },
    costPrice: { type: Number, required: true, min: 0 },
    sellPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 5 },
    barcode: { type: String, sparse: true },
    image: { type: String },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", sku: "text", barcode: "text" });
ProductSchema.index({ stock: 1 });

const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
