import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupplier extends Document {
  name: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

const Supplier: Model<ISupplier> =
  mongoose.models.Supplier ?? mongoose.model<ISupplier>("Supplier", SupplierSchema);

export default Supplier;
